import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const recovery = request.nextUrl.searchParams.get("flow") === "recovery";
  const supabase = await createClient();
  let success = false;
  if (supabase && code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      success = !error;
    } catch {
      /* Invalid links fail closed. */
    }
  }
  const destination = success
    ? recovery
      ? "/reset-password"
      : "/chat"
    : "/login?error=link";
  const response = new Response(null, {
    status: 307,
    headers: { Location: destination },
  });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
