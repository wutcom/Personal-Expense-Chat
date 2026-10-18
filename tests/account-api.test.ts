// @vitest-environment node
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createTestDatabase, userA, userB } from "./helpers/database";
import { GET, PATCH } from "@/app/api/account/route";
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getAuthenticatedSession: getSession }));
let db: PGlite;
let currentUser = userA;
// Adapter executes the route's query under the actual PostgreSQL role/RLS.
// Auth identity is stubbed; no Supabase network/Auth server is impersonated here.
function client() {
  return {
    from: (table: string) => {
      if (table !== "profiles") throw Error("Unexpected table");
      let update: { display_name: string } | undefined;
      let owner = "";
      const query = {
        select: () => query,
        update: (input: { display_name: string }) => {
          update = input;
          return query;
        },
        eq: (column: string, value: string) => {
          if (column !== "user_id") throw Error("Unexpected filter");
          owner = value;
          return query;
        },
        maybeSingle: async () => {
          const result = await asUser(db, currentUser, () =>
            update
              ? db.query(
                  "update profiles set display_name=$1 where user_id=$2 returning user_id,display_name,created_at",
                  [update.display_name, owner],
                )
              : db.query(
                  "select user_id,display_name,created_at from profiles where user_id=$1",
                  [owner],
                ),
          );
          return { data: result.rows[0] ?? null, error: null };
        },
      };
      return query;
    },
  };
}
beforeAll(async () => {
  db = await createTestDatabase();
}, 30000);
afterAll(async () => {
  await db?.close();
});
afterEach(() => vi.unstubAllEnvs());
beforeEach(() => {
  vi.stubEnv("SITE_URL", "https://expense.example");
  currentUser = userA;
  getSession.mockReset();
  getSession.mockImplementation(async () => ({
    status: "authenticated",
    user: { id: currentUser },
    supabase: client(),
  }));
});
function patch(body: unknown, origin = "https://expense.example") {
  return new Request("https://expense.example/api/account", {
    method: "PATCH",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
describe("account API + PostgreSQL RLS", () => {
  it("reads only the authenticated owner's profile", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).profile.user_id).toBe(userA);
    expect(response.headers.get("cache-control")).toContain("no-store");
    currentUser = userB;
    expect((await (await GET()).json()).profile.user_id).toBe(userB);
  });
  it("rejects caller-supplied ownership before writing", async () => {
    const response = await PATCH(
      patch({ display_name: "intruder", user_id: userB }),
    );
    expect(response.status).toBe(400);
    expect(
      (
        await db.query("select display_name from profiles where user_id=$1", [
          userB,
        ])
      ).rows,
    ).toEqual([{ display_name: null }]);
  });
  it("writes only to the authenticated owner", async () => {
    const response = await PATCH(patch({ display_name: " A name " }));
    expect(response.status).toBe(200);
    const { profile } = await response.json();
    expect(profile.user_id).toBe(userA);
    expect(profile.display_name).toBe("A name");
    expect(
      (
        await db.query("select display_name from profiles where user_id=$1", [
          userB,
        ])
      ).rows,
    ).toEqual([{ display_name: null }]);
  });
  it("does not allow cross-origin cookie-authenticated writes", async () => {
    expect(
      (await PATCH(patch({ display_name: "x" }, "https://evil.example")))
        .status,
    ).toBe(403);
  });
  it.each(["unauthenticated", "unconfigured"])(
    "fails closed when %s",
    async (status) => {
      getSession.mockResolvedValue({ status });
      expect((await GET()).status).toBe(status === "unconfigured" ? 503 : 401);
      expect((await PATCH(patch({ display_name: "x" }))).status).toBe(
        status === "unconfigured" ? 503 : 401,
      );
    },
  );
  it("refuses profile writes when the canonical origin is absent", async () => {
    vi.stubEnv("SITE_URL", "");
    expect((await PATCH(patch({ display_name: "x" }))).status).toBe(503);
  });
  it("rejects malformed JSON and unrecognized profile fields", async () => {
    expect(
      (
        await PATCH(
          new Request("https://expense.example/api/account", {
            method: "PATCH",
            headers: {
              origin: "https://expense.example",
              "content-type": "application/json",
            },
            body: "{",
          }),
        )
      ).status,
    ).toBe(400);
    expect((await PATCH(patch({ display_name: "" }))).status).toBe(400);
  });
});
