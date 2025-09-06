// lib/chatStore.ts
import { getSupabase } from "./supabaseClient";

/** List most-recent events for a role */
export async function listEvents(role: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("role", role)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

/** Create a new event/thread */
export async function createEvent(title: string, role: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("events")
    .insert({ title, role })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Load messages for an event */
export async function listMessages(event_id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("event_id", event_id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Add a message + bump event.updated_at */
export async function addMessage(event_id: string, role: string, content: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("messages")
    .insert({ event_id, role, content });
  if (error) throw error;
  await supabase.from("events").update({ updated_at: new Date().toISOString() }).eq("id", event_id);
}
