import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseConfig } from "@/lib/supabase/config";
import {
  authSchema,
  newPasswordSchema,
  profileSchema,
} from "@/lib/validation/auth";
afterEach(() => vi.unstubAllEnvs());
describe("auth validation", () => {
  it("rejects missing config and secret keys", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    for (const key of ["", "sb_secret_PRIVATE", "invalid"]) {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key);
      expect(getSupabaseConfig()).toBeNull();
    }
  });
  it("treats blank, malformed and insecure project URLs as unconfigured without throwing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    for (const value of [
      "",
      "not-a-url",
      "http://external.example",
      "javascript:alert(1)",
    ]) {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", value);
      expect(getSupabaseConfig()).toBeNull();
    }
  });
  it("allows a publishable key but never a legacy service-role key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    for (const role of ["anon", "service_role"]) {
      vi.stubEnv(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        `a.${btoa(JSON.stringify({ role }))}.c`,
      );
      expect(Boolean(getSupabaseConfig())).toBe(role === "anon");
    }
  });
  it("requires valid email, rejects weak signup passwords, and preserves password whitespace", () => {
    expect(
      authSchema.safeParse({ intent: "signup", email: "bad", password: "123" })
        .success,
    ).toBe(false);
    expect(
      authSchema.parse({
        intent: "signin",
        email: "A@example.com",
        password: " secret ",
      }),
    ).toMatchObject({ password: " secret " });
  });
  it("checks password confirmation and rejects ownership injection", () => {
    expect(
      newPasswordSchema.safeParse({
        password: "abcdefgh",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ display_name: "A", user_id: "B" }).success,
    ).toBe(false);
  });
});
