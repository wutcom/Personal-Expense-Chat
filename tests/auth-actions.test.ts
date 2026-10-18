// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticate, signOut, updatePassword } from "@/app/(auth)/actions";
const { createClient, getSession, auth, redirect } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getSession: vi.fn(),
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
  },
  redirect: vi.fn((url: string) => {
    throw Error(`redirect:${url}`);
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/auth/session", () => ({ getAuthenticatedSession: getSession }));
vi.mock("next/navigation", () => ({ redirect }));
const idle = { status: "idle" as const, message: "" };
function form(input: Record<string, string>) {
  const f = new FormData();
  for (const [key, value] of Object.entries(input)) f.set(key, value);
  return f;
}
beforeEach(() => {
  vi.resetAllMocks();
  createClient.mockResolvedValue({ auth });
  getSession.mockResolvedValue({
    status: "authenticated",
    user: { id: "A" },
    supabase: { auth },
  });
  redirect.mockImplementation((url: string) => {
    throw Error(`redirect:${url}`);
  });
  vi.stubEnv("SITE_URL", "https://expense.example");
});
afterEach(() => vi.unstubAllEnvs());
describe("authentication server actions", () => {
  it("validates input before making Auth requests", async () => {
    expect(
      (
        await authenticate(
          idle,
          form({ intent: "signup", email: "invalid", password: "short" }),
        )
      ).status,
    ).toBe("error");
    expect(createClient).not.toHaveBeenCalled();
  });
  it("signs in and redirects only after Auth succeeds", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    await expect(
      authenticate(
        idle,
        form({
          intent: "signin",
          email: " A@example.com ",
          password: " secret ",
        }),
      ),
    ).rejects.toThrow("redirect:/chat");
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@example.com",
      password: " secret ",
    });
  });
  it("shows a generic sign-in error without leaking provider details", async () => {
    auth.signInWithPassword.mockResolvedValue({
      error: { message: "sensitive internal detail" },
    });
    const state = await authenticate(
      idle,
      form({ intent: "signin", email: "a@example.com", password: "invalid" }),
    );
    expect(state.status).toBe("error");
    expect(state.message).not.toContain("sensitive");
    expect(redirect).not.toHaveBeenCalled();
  });
  it("requires email confirmation when signup has no session", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const state = await authenticate(
      idle,
      form({ intent: "signup", email: "a@example.com", password: "abcdefgh" }),
    );
    expect(state.status).toBe("success");
    expect(redirect).not.toHaveBeenCalled();
    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { emailRedirectTo: "https://expense.example/auth/callback" },
      }),
    );
  });
  it("supports signup when the provider returns a valid session", async () => {
    auth.signUp.mockResolvedValue({
      data: { session: { access_token: "test" } },
      error: null,
    });
    await expect(
      authenticate(
        idle,
        form({
          intent: "signup",
          email: "a@example.com",
          password: "abcdefgh",
        }),
      ),
    ).rejects.toThrow("redirect:/chat");
  });
  it("uses a configured origin for password-reset email links", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    const state = await authenticate(
      idle,
      form({ intent: "reset", email: "a@example.com" }),
    );
    expect(state.status).toBe("success");
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("a@example.com", {
      redirectTo: "https://expense.example/auth/callback?flow=recovery",
    });
  });
  it("does not send recovery mail when the canonical origin is unsafe", async () => {
    vi.stubEnv("SITE_URL", "http://external.example");
    expect(
      (
        await authenticate(
          idle,
          form({ intent: "reset", email: "a@example.com" }),
        )
      ).status,
    ).toBe("error");
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });
  it("requires HTTPS origins in production, including localhost", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_URL", "http://localhost:3000");
    expect(
      (
        await authenticate(
          idle,
          form({ intent: "reset", email: "a@example.com" }),
        )
      ).status,
    ).toBe("error");
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });
  it("fails closed without Supabase and on transport errors", async () => {
    createClient.mockResolvedValue(null);
    expect(
      (
        await authenticate(
          idle,
          form({ intent: "signin", email: "a@example.com", password: "x" }),
        )
      ).status,
    ).toBe("error");
    createClient.mockResolvedValue({ auth });
    auth.signInWithPassword.mockRejectedValue(Error("network"));
    expect(
      (
        await authenticate(
          idle,
          form({ intent: "signin", email: "a@example.com", password: "x" }),
        )
      ).status,
    ).toBe("error");
  });
  it("requires a verified session to change password", async () => {
    getSession.mockResolvedValue({ status: "unauthenticated" });
    expect(
      (
        await updatePassword(
          idle,
          form({ password: "abcdefgh", confirmPassword: "abcdefgh" }),
        )
      ).status,
    ).toBe("error");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("validates confirmation and updates the signed-in user's password", async () => {
    expect(
      (
        await updatePassword(
          idle,
          form({ password: "abcdefgh", confirmPassword: "different" }),
        )
      ).status,
    ).toBe("error");
    auth.updateUser.mockResolvedValue({ error: null });
    await expect(
      updatePassword(
        idle,
        form({ password: "abcdefgh", confirmPassword: "abcdefgh" }),
      ),
    ).rejects.toThrow("redirect:/settings");
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "abcdefgh" });
  });
  it("clears the local Supabase session on sign out", async () => {
    auth.signOut.mockResolvedValue({ error: null });
    await expect(signOut()).rejects.toThrow("redirect:/login");
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("keeps sign-out failures recoverable", async () => {
    auth.signOut.mockRejectedValue(Error("network"));
    await expect(signOut()).rejects.toThrow("redirect:/settings?error=signout");
  });
});
