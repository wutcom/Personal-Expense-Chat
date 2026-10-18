import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Cookie refresh only. Layouts, pages, actions and API routes enforce authorization.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}
export const config = {
  matcher: [
    "/chat/:path*",
    "/dashboard/:path*",
    "/budgets/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/login",
    "/reset-password",
    "/auth/:path*",
    "/api/:path*",
  ],
};
