import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const token_hash = params.get("token_hash");
  const supabase = await createClient();
  let success = false;
  if (supabase && token_hash && (type === "signup" || type === "recovery")) {
    try {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash });
      success = !error;
    } catch {
      /* Invalid links fail closed. */
    }
  }
  const destination = success
    ? type === "recovery"
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
