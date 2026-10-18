import "server-only";
import { z } from "zod";

export function getSiteOrigin() {
  const value =
    process.env.SITE_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");
  const parsed = z.url().safeParse(value);
  if (!parsed.success) return null;
  const url = new URL(parsed.data);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    return null;
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    return null;
  return url.origin;
}
