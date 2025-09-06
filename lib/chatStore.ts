import { supabase } from "./supabaseClient";

export async function listEvents(role: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("role", role)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEvent(role: string, title: string, meta: any = {}) {
  const { data, error } = await supabase
    .from("events")
    .insert({ role, title, meta })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function ensureThread(eventId: string, role: string, threadKey: string) {
  const { data: byKey } = await supabase
    .from("threads")
    .select("*")
    .eq("thread_key", threadKey)
    .single();
  if (byKey) return byKey;

  const { data, error } = await supabase
    .from("threads")
    .insert({ event_id: eventId, role, thread_key: threadKey })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchMessages(threadId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addMessage(threadId: string, sender: "user"|"assistant", content: string) {
  const { error } = await supabase
    .from("messages")
    .insert({ thread_id: threadId, sender, content });
  if (error) throw error;
}
