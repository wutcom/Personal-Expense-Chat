// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as confirm } from "@/app/auth/confirm/route";
import { GET as callback } from "@/app/auth/callback/route";
const { createClient, verifyOtp, exchangeCodeForSession } = vi.hoisted(() => ({
  createClient: vi.fn(),
  verifyOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
beforeEach(() => {
  vi.clearAllMocks();
  createClient.mockResolvedValue({
    auth: { verifyOtp, exchangeCodeForSession },
  });
  verifyOtp.mockResolvedValue({ error: null });
  exchangeCodeForSession.mockResolvedValue({ error: null });
});
describe("email confirmation and recovery", () => {
  it("routes verified recovery tokens to password update, never a supplied next URL", async () => {
    const r = await confirm(
      new NextRequest(
        "https://expense.example/auth/confirm?type=recovery&token_hash=valid&next=https://evil.example",
      ),
    );
    expect(r.headers.get("location")).toBe("/reset-password");
    expect(r.headers.get("cache-control")).toContain("no-store");
    expect(r.headers.get("referrer-policy")).toBe("no-referrer");
  });
  it("accepts signup confirmation", async () => {
    expect(
      (
        await confirm(
          new NextRequest(
            "https://expense.example/auth/confirm?type=signup&token_hash=valid",
          ),
        )
      ).headers.get("location"),
    ).toBe("/chat");
  });
  it("rejects expired tokens, absent tokens and unsupported OTP types", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "expired" } });
    for (const query of [
      "type=signup&token_hash=expired",
      "type=recovery",
      "type=invite&token_hash=x",
    ])
      expect(
        (
          await confirm(
            new NextRequest(`https://expense.example/auth/confirm?${query}`),
          )
        ).headers.get("location"),
      ).toBe("/login?error=link");
  });
  it("exchanges PKCE codes and uses fixed destinations", async () => {
    const r = await callback(
      new NextRequest(
        "https://expense.example/auth/callback?code=valid&flow=recovery&next=//evil.example",
      ),
    );
    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid");
    expect(r.headers.get("location")).toBe("/reset-password");
  });
  it("fails safely without configuration", async () => {
    createClient.mockResolvedValue(null);
    expect(
      (
        await callback(
          new NextRequest("https://expense.example/auth/callback?code=valid"),
        )
      ).headers.get("location"),
    ).toContain("/login?error=link");
  });
});
