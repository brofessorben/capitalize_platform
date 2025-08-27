// app/api/test/route.ts
export const runtime = "edge";

import { createClient } from "@supabase/supabase-js";

function makeClient(req: Request) {
  // Prefer env vars; fall back to headers you can send from curl
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    req.headers.get("supabase-url") ||
    "";
  const key =
    process.env.SUPABASE_ANON_KEY ||
    req.headers.get("apikey") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (!url || !key) {
    return { error: "Missing SUPABASE_URL and/or SUPABASE_ANON_KEY", sb: null as any };
  }

  const sb = createClient(url, key, { global: { fetch } });
  return { sb, error: null };
}

export async function GET(req: Request) {
  const { sb, error } = makeClient(req);
  if (error) return Response.json({ ok: false, error }, { status: 400 });

  // Simple “ping” — doesn’t require a logged-in user
  const { error: pingErr } = await sb.auth.getSession();
  return Response.json({ ok: true, supabase_ready: !pingErr });
}

export async function POST(req: Request) {
  const { sb, error } = makeClient(req);
  if (error) return Response.json({ ok: false, error }, { status: 400 });

  let body: any = {};
  try { body = await req.json(); } catch {}

  // Optional: if you send { "table": "your_table" } we’ll select 1 row
  if (body?.table) {
    const { data, error: dbErr } = await sb.from(body.table).select("*").limit(1);
    if (dbErr) return Response.json({ ok: false, error: dbErr.message }, { status: 400 });
    return Response.json({ ok: true, table: body.table, sample: data });
  }

  // Default: just prove Supabase is reachable
  const { error: pingErr } = await sb.auth.getSession();
  return Response.json({ ok: true, supabase_ready: !pingErr, echo: body });
}
