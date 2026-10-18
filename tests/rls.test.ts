// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import {
  asUser,
  createTestDatabase,
  userA,
  userB,
  categoryB,
  tables,
} from "./helpers/database";
let db: PGlite;
beforeAll(async () => {
  db = await createTestDatabase();
}, 30000);
afterAll(async () => {
  await db?.close();
});
describe("real PostgreSQL owner RLS on all seven tables", () => {
  it.each(tables)(
    "%s only returns the logged-in owner's rows",
    async (table) => {
      for (const user of [userA, userB])
        await asUser(db, user, async () => {
          const { rows } = await db.query<{ user_id: string }>(
            `select user_id from ${table}`,
          );
          expect(rows).toEqual([{ user_id: user }]);
        });
    },
  );
  it.each(tables)(
    "%s cannot update or delete another user's rows",
    async (table) => {
      await asUser(db, userA, async () => {
        const update = await db.query(
          `update ${table} set user_id=user_id where user_id=$1 returning user_id`,
          [userB],
        );
        const deletion = await db.query(
          `delete from ${table} where user_id=$1 returning user_id`,
          [userB],
        );
        expect(update.rows).toEqual([]);
        expect(deletion.rows).toEqual([]);
      });
    },
  );
  it.each(tables)("%s cannot transfer ownership", async (table) => {
    await expect(
      asUser(db, userA, () =>
        db.query(`update ${table} set user_id=$1 where user_id=$2`, [
          userB,
          userA,
        ]),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it.each(tables)("%s blocks anonymous reads and writes", async (table) => {
    await expect(
      asUser(db, null, () => db.query(`select * from ${table}`)),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      asUser(db, null, () => db.query(`delete from ${table}`)),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it.each(tables)("%s rejects inserts for another owner", async (table) => {
    await expect(
      asUser(db, userA, async () => {
        const columns = await db.query<{ column_name: string }>(
          "select column_name from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position",
          [table],
        );
        const names = columns.rows.map((r) => r.column_name);
        const values = names
          .map((n) =>
            n === "user_id"
              ? `'${userB}'::uuid`
              : n === "id"
                ? "gen_random_uuid()"
                : n === "idempotency_key"
                  ? "gen_random_uuid()"
                  : n === "month"
                    ? "date '2026-12-01'"
                    : n === "slug"
                      ? "'foreign'"
                      : n,
          )
          .join(",");
        return db.query(
          `insert into ${table} (${names.join(",")}) select ${values} from ${table} where user_id=$1 limit 1`,
          [userA],
        );
      }),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("foreign categories cannot be used even with the current user's owner ID", async () => {
    await expect(
      asUser(db, userA, () =>
        db.query(
          "insert into transactions (user_id,category_id,kind,amount) values ($1,$2,'expense',5)",
          [userA, categoryB],
        ),
      ),
    ).rejects.toMatchObject({ code: "23503" });
  });
  it("new users have exactly one profile and Thai/Bangkok default settings", async () => {
    const { rows } = await db.query(
      "select timezone,currency,language from user_settings where user_id=$1",
      [userA],
    );
    expect(rows).toEqual([
      { timezone: "Asia/Bangkok", currency: "THB", language: "th" },
    ]);
    expect(
      (await db.query("select * from profiles where user_id=$1", [userA])).rows,
    ).toHaveLength(1);
  });
  it("the bootstrap SECURITY DEFINER function is not callable by authenticated users", async () => {
    await asUser(db, userA, async () => {
      expect(
        (
          await db.query<{ allowed: boolean }>(
            "select has_function_privilege('authenticated','public.handle_new_user()','execute') as allowed",
          )
        ).rows[0].allowed,
      ).toBe(false);
    });
  });
});
