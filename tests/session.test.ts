// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthenticatedSession, requireUser } from "@/lib/auth/session";
const { createClient, getUser, redirect } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw Error(`redirect:${url}`);
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/navigation", () => ({ redirect }));
beforeEach(() => {
  vi.clearAllMocks();
  createClient.mockResolvedValue({ auth: { getUser } });
});
describe("server authorization", () => {
  it("validates a user through Auth instead of trusting cookie sessions", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "A" } }, error: null });
    expect((await getAuthenticatedSession()).status).toBe("authenticated");
    expect(getUser).toHaveBeenCalledOnce();
  });
  it.each([null, { id: "A", is_anonymous: true }])(
    "rejects missing and anonymous users",
    async (user) => {
      getUser.mockResolvedValue({ data: { user }, error: null });
      expect((await getAuthenticatedSession()).status).toBe("unauthenticated");
    },
  );
  it("rejects revoked or forged credentials even if user data accompanies the error", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "forged" } },
      error: { message: "invalid token" },
    });
    await expect(requireUser()).rejects.toThrow("redirect:/login");
  });
  it("fails closed on Auth transport errors", async () => {
    getUser.mockRejectedValue(Error("network"));
    expect((await getAuthenticatedSession()).status).toBe("unauthenticated");
  });
  it("redirects to login when configuration is absent", async () => {
    createClient.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("redirect:/login");
  });
});
