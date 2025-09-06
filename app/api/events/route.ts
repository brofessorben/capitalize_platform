import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side client: use SERVICE ROLE (secret) + proper arg order: (url, key)
const supabase = createClient(
  process.env.SUPABASE_URL!,               // <-- URL first
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // <-- key second
);

export async function GET(req: Request) {
  const role = new URL(req.url).searchParams.get("role") || "referrer";

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("role", role)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ events: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, role } = body;

  if (!title || !role) {
    return NextResponse.json({ error: "Missing title or role" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("events")
    .insert({ title, role, status: "open" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ event: data }, { status: 201 });
}
