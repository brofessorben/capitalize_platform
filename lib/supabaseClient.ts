import { createClient } from "@supabase/supabase-js";

// Make sure these env vars are set in Vercel: 
// SUPABASE_URL and SUPABASE_ANON_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Check your Vercel project settings.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
