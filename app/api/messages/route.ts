import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const { threadId, sender, content } = await req.json();
  const { error } = await supabase
    .from("messages")
    .insert({ thread_id: threadId, sender, content });
  return NextResponse.json({ ok: !error, error: error?.message });
}
