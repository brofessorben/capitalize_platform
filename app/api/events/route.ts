import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const role = new URL(req.url).searchParams.get("role") || "referrer";

  // Example: return latest 20 events for this role
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("role", role)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data ?? [] });
}
