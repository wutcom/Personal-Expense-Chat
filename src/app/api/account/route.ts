export const dynamic = "force-dynamic";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { getSiteOrigin } from "@/lib/auth/site-url";
import { profileSchema } from "@/lib/validation/auth";
const headers = { "Cache-Control": "private, no-store, max-age=0" };
function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers });
}

export async function GET() {
  const session = await getAuthenticatedSession();
  if (session.status === "unconfigured")
    return json({ error: "Service unavailable" }, 503);
  if (session.status !== "authenticated")
    return json({ error: "Unauthorized" }, 401);
  const { data, error } = await session.supabase
    .from("profiles")
    .select("user_id, display_name, created_at")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) return json({ error: "Unable to load profile" }, 500);
  return json({ profile: data });
}

export async function PATCH(request: Request) {
  const session = await getAuthenticatedSession();
  if (session.status === "unconfigured")
    return json({ error: "Service unavailable" }, 503);
  if (session.status !== "authenticated")
    return json({ error: "Unauthorized" }, 401);
  // Cookie auth: require a same-origin browser write, never trust a caller-supplied user_id.
  const origin = getSiteOrigin();
  if (!origin) return json({ error: "Service unavailable" }, 503);
  if (request.headers.get("origin") !== origin)
    return json({ error: "Forbidden" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ error: "Expected JSON" }, 415);
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return json({ error: "Invalid profile" }, 400);
  const { data, error } = await session.supabase
    .from("profiles")
    .update(parsed.data)
    .eq("user_id", session.user.id)
    .select("user_id, display_name, created_at")
    .maybeSingle();
  if (error) return json({ error: "Unable to update profile" }, 500);
  if (!data) return json({ error: "Profile not found" }, 404);
  return json({ profile: data });
}
