import { createClient } from "@supabase/supabase-js";

const url   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const sKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(url, sKey, {
  auth: { persistSession: false },
});
