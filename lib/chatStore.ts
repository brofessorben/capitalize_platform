// lib/chatStore.ts
import { getServerSupabase, getSupabase } from "./supabaseClient";

/** THREADS (aka events) */
export async function listThreads(role: string) {
  const supabase = getSupabase();
  return supabase.from("events")
    .select("*")
    .eq("role", role)
    .order("updated_at", { ascending: false });
}

export async function createThread(title: string, role: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("events")
    .insert([{ title, role, status: "open" }])
    .select("*")
    .single();
  return { data, error };
}

/** MESSAGES */
export async function listMessages(threadId: string) {
  const supabase = getSupabase();
  return supabase
    .from("messages")
    .select("*")
    .eq("event_id", threadId)
    .order("created_at", { ascending: true });
}

export async function sendMessage(threadId: string, sender: string, content: string) {
  const supabase = getSupabase();
  return supabase
    .from("messages")
    .insert([{ event_id: threadId, role: sender, content }])
    .select("*")
    .single();
}

/** REALTIME subscription to a thread */
export function subscribeMessages(threadId: string, onInsert: (row: any) => void) {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`messages-${threadId}`)
    .on("postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `event_id=eq.${threadId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
