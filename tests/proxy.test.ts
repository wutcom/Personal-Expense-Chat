// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateSession } from "@/lib/supabase/proxy";
import type { CookieOptions } from "@supabase/ssr";
const { createServerClient, getUser } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock("@supabase/ssr", () => ({ createServerClient }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
});
afterEach(() => vi.unstubAllEnvs());
describe("session cookie refresh", () => {
  it("propagates refreshed cookies to request and response, preserving no-store", async () => {
    createServerClient.mockImplementation(
      (
        _url: string,
        _key: string,
        options: {
          cookies: {
            setAll: (
              values: { name: string; value: string; options: CookieOptions }[],
              headers: Record<string, string>,
            ) => void;
          };
        },
      ) => ({
        auth: {
          getUser: async () => {
            options.cookies.setAll(
              [
                {
                  name: "sb-token",
                  value: "refreshed",
                  options: {
                    httpOnly: true,
                    secure: true,
                    sameSite: "lax",
                    path: "/",
                  },
                },
              ],
              {
                "Cache-Control": "private, no-store",
                Expires: "0",
                Pragma: "no-cache",
              },
            );
            options.cookies.setAll(
              [{ name: "sb-second", value: "second", options: { path: "/" } }],
              {},
            );
            return { data: { user: { id: "A" } }, error: null };
          },
        },
      }),
    );
    const request = new NextRequest("https://expense.example/chat");
    const response = await updateSession(request);
    expect(request.cookies.get("sb-token")?.value).toBe("refreshed");
    expect(response.cookies.get("sb-token")?.value).toBe("refreshed");
    expect(response.cookies.get("sb-second")?.value).toBe("second");
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("returns a no-store response even when refresh fails", async () => {
    getUser.mockRejectedValue(Error("network"));
    createServerClient.mockReturnValue({ auth: { getUser } });
    const response = await updateSession(
      new NextRequest("https://expense.example/chat"),
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("does not initialize Supabase if configuration is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    await updateSession(new NextRequest("https://expense.example/login"));
    expect(createServerClient).not.toHaveBeenCalled();
  });
});
