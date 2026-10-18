"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const config = getSupabaseConfig();
  if (!config)
    throw new Error("Supabase public configuration is missing or invalid");
  return createBrowserClient<Database>(config.url, config.key);
}
