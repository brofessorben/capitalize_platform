// lib/chatStore.ts
import { getServerSupabase } from "./supabaseClient";

/** List recent events for a role (referrer | vendor | host) */
export async function listEvents(role: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("role", role)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

/** List messages for a specific event thread */
export async function listMessages(eventId: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
