// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabaseClient";

// GET /api/chat?lead_id=<uuid>&limit=100
export async function GET(req: Request) {
  const supabase = getSupabase();

  // who is calling?
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lead_id = searchParams.get("lead_id");
  const limit = Number(searchParams.get("limit") ?? 100);

  // fetch this user's messages (optionally scoped to a lead/thread)
  let query = supabase
    .from("messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (lead_id) query = query.eq("lead_id", lead_id);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

// POST /api/chat
// body: { text: string, lead_id?: string, role?: "user" | "ai", sender?: "vendor" | "host" | "referrer" | "ai" }
export async function POST(req: Request) {
  const supabase = getSupabase();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // no-op
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const lead_id = body?.lead_id ?? null;
  const role = body?.role ?? "user";
  const sender = body?.sender ?? role; // basic mirror

  if (!text) {
    return NextResponse.json({ error: "Missing 'text' in request body" }, { status: 400 });
  }

  // insert the message with the current user's id
  const { data, error } = await supabase
    .from("messages")
    .insert({
      user_id: user.id,
      lead_id,
      text,
      role,
      sender,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data }, { status: 201 });
}
