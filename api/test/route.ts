import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";  // important: force Node runtime

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Just ping Supabase
    const { error } = await supabase.auth.getSession();
    if (error) throw error;

    return NextResponse.json({ ok: true, supabase_ready: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const body = await req.json();

    // Just echo back + prove supabase client instantiates
    return NextResponse.json({ ok: true, supabase_ready: true, echo: body });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
