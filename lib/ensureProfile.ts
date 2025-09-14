// lib/ensureProfile.ts
import { getSupabase } from "./supabaseClient";

export async function ensureProfile(user: any) {
  const supabase = getSupabase();
  if (!user) return;

  const email = user.email ?? null;
  const full_name = user.user_metadata?.full_name ?? null;

  // Upsert into profiles (id, email, full_name)
  await supabase
    .from("profiles")
    .upsert(
      [
        {
          id: user.id,
          email: email,
          full_name: full_name,
        } as any,
      ],
      { onConflict: "id" }
    );
}
