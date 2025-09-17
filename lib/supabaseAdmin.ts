// lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!url || !service) {
  console.warn(
    "Supabase admin env missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

export const supabaseAdmin: SupabaseClient = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
