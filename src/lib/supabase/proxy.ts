import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  const cacheHeaders = new Headers({
    "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
    Expires: "0",
    Pragma: "no-cache",
  });
  let response = NextResponse.next({ request });
  const applyCacheHeaders = () => {
    cacheHeaders.forEach((value, name) => response.headers.set(name, value));
  };
  applyCacheHeaders();
  const config = getSupabaseConfig();
  if (!config) return response;
  const supabase = createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, headers) => {
        // SSR delivers cache headers on the first write only. Retain them on subsequent writes.
        for (const [name, value] of Object.entries(headers))
          cacheHeaders.set(name, value);
        const previousCookies = response.cookies.getAll();
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const cookie of previousCookies) response.cookies.set(cookie);
        for (const { name, value, options } of values)
          response.cookies.set(name, value, options);
        applyCacheHeaders();
      },
    },
  });
  try {
    await supabase.auth.getUser();
  } catch {
    /* Layouts and API handlers independently fail closed. */
  }
  return response;
}
