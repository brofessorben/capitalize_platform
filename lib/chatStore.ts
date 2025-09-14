// lib/chatStore.ts
import { getSupabase } from "./supabaseClient";

/** THREADS (aka events) */
export async function listThreads(role?: string) {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Not authenticated");

  let q = supabase
    .from("threads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (role) q = q.eq("role", role);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createThread(title: string, role?: string) {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Not authenticated");

  const payload: any = { user_id: user.id, title, role: role ?? null };

  const { data, error } = await supabase
    .from("threads")
    .insert([payload] as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** MESSAGES */
export async function listMessages(lead_id: string) {
  const supabase = getSupabase();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", user.id)
    .eq("lead_id", lead_id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function sendMessage(opts: {
  lead_id: string;
  text: string;
  role?: "user" | "ai";
  sender?: "vendor" | "host" | "referrer" | "ai";
}) {
  const { lead_id, text } = opts;
  const role = opts.role ?? "user";
  const sender = opts.sender ?? role;

  const supabase = getSupabase();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Not authenticated");

  const payload: any = {
    user_id: user.id,
    lead_id,
    text,
    role,
    sender,
  };

  const { data, error } = await supabase
    .from("messages")
    .insert([payload] as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
