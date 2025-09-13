// lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * We use the public (anon) key for both client and server routes here.
 * It’s safe as long as your Row Level Security (RLS) policies are correct.
 * If you later need admin actions, add a separate server-only client that
 * uses SUPABASE_SERVICE_ROLE (never expose that to the browser).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

// --- Browser (singleton) ----------------------------------------------------
let _browserClient: SupabaseClient | null = null;

/** Use this inside React components / client code */
export function getSupabase(): SupabaseClient {
  if (!_browserClient) {
    _browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _browserClient;
}

// --- Server (per-request) ---------------------------------------------------
/** Use this inside Next.js route handlers / server code */
export function getServerSupabase(): SupabaseClient {
  // New client per request; no session persistence on the server
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
