// lib/ensureProfile.ts
"use client";

import { getSupabase } from "./supabaseClient";

/**
 * Ensures there is a row in public.profiles for the current user.
 * Safe to call on every page load.
 */
export async function ensureProfile() {
  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;

  const email = user.email ?? null;
  const full_name =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    null;

  // Upsert into profiles (id, email, full_name)
  await supabase.from("profiles").upsert(
    [{ id: user.id, email, full_name }],
    { onConflict: "id" }
  );
}
