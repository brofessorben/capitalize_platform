// lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  _client = createBrowserClient(url, anon, {
    cookies: {
      name: "sb-auth-token",
      lifetime: 60 * 60 * 24 * 7, // 7 days
      domain: ".vercel.app",      // IMPORTANT for Vercel
      path: "/",
    },
  });

  return _client;
}
