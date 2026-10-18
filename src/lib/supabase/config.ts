import { z } from "zod";

function isPublicKey(value: string) {
  if (value.startsWith("sb_publishable_")) return true;
  try {
    return (
      JSON.parse(
        atob(value.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      ).role === "anon"
    );
  } catch {
    return false;
  }
}
const configSchema = z.object({
  url: z.url().refine((value) => {
    if (!URL.canParse(value)) return false;
    const u = new URL(value);
    return (
      u.protocol === "https:" ||
      (u.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(u.hostname))
    );
  }),
  key: z.string().min(1).refine(isPublicKey),
});
export function getSupabaseConfig() {
  const parsed = configSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return parsed.success ? parsed.data : null;
}
