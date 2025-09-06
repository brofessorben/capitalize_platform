import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const role = new URL(req.url).searchParams.get("role") || "referrer";
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("role", role)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}

export async function POST(req: Request) {
  const { role, title, meta } = await req.json();
  const { data, error } = await supabase
    .from("events")
    .insert({ role, title, meta })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: data });
}
