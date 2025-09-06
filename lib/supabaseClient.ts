import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[Supabase] Missing env vars. Check your Vercel settings.");
  }

  _client = createClient(url ?? "https://example.supabase.co", key ?? "invalid-key");
  return _client;
}
