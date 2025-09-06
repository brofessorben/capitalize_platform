import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Lazy getter so importing this module doesn't crash builds
 * when env vars are missing at compile time.
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Don't throw at import-time; let routes/components handle empty creds at runtime.
  // This avoids "Missing NEXT_PUBLIC_SUPABASE_URL..." during Next build.
  cached = createClient(url, key);
  return cached;
}

/**
 * Optional convenience export for code that expects a `supabase` variable.
 * Uses the same lazy instance.
 */
export const supabase = getSupabase();

export default supabase;
