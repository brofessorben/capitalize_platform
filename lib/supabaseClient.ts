// lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * We support both public (browser) and server env vars.
 * Browser: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 * Server:  SUPABASE_URL / SUPABASE_ANON_KEY (or SUPABASE_KEY)
 */

const PUBLIC_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  "";

if (!PUBLIC_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
}
if (!PUBLIC_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_(ANON_)KEY"
  );
}

// cache singletons to avoid re-creating
let _browserClient: SupabaseClient | null = null;
let _serverClient: SupabaseClient | null = null;

/** Use inside Client Components / the browser */
export function getSupabase(): SupabaseClient {
  if (!_browserClient) {
    _browserClient = createClient(PUBLIC_URL, PUBLIC_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return _browserClient;
}

/** Use inside Server Components / API routes */
export function getServerSupabase(): SupabaseClient {
  if (!_serverClient) {
    _serverClient = createClient(PUBLIC_URL, PUBLIC_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _serverClient;
}
