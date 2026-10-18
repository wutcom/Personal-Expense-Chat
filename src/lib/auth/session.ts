import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Always revalidate with Auth. Never authorize using getSession() or a user ID from input.
export async function getAuthenticatedSession() {
  const supabase = await createClient();
  if (!supabase) return { status: "unconfigured" as const };
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user || user.is_anonymous)
      return { status: "unauthenticated" as const };
    return { status: "authenticated" as const, supabase, user };
  } catch {
    return { status: "unauthenticated" as const };
  }
}

export async function requireUser() {
  const session = await getAuthenticatedSession();
  if (session.status !== "authenticated") redirect("/login");
  return session;
}
