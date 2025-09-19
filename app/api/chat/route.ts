// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// GET /api/chat?lead_id=<uuid>&limit=100
export async function GET(req: Request) {
  const supabase = getSupabase();

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

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const lead_id = body?.lead_id ?? null;
  const role = body?.role ?? "user";
  const sender = body?.sender ?? role;

  if (!text) {
    return NextResponse.json({ error: "Missing 'text' in request body" }, { status: 400 });
  }

  // Normalize event id: server expects UUID for the event/event thread.
  const isUuid = (s: any) => typeof s === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(s);

  // We'll compute event_id early to ensure it's available for any return paths.
  // Always produce a proper UUID (no non-UUID fallback) so DB UUID FK columns won't reject it.
  const event_id = isUuid(lead_id) ? lead_id : (typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : randomUUID());

  // 👇 TypeScript-safe: insert an ARRAY and cast payload to any to avoid 'never' inference
  // Allow client-side demo/anonymous posts: accept `user_id` from body if present.
  const safeUserId = isUuid(body?.user_id) ? body.user_id : null;

  const payload: any = {
    user_id: safeUserId,
    // Always set an `event_id` for the conversation thread. Only set `lead_id` when the
    // incoming `lead_id` is a valid UUID (so we don't create a foreign-key reference to a
    // non-existent `leads` row and trigger FK violations).
  event_id,
  // If the client provided a real `lead_id` (UUID referring to a row in `leads`),
  // store that value so the FK constraint points to an existing lead. If it's a
  // UI temporary id (non-UUID), do not set `lead_id` to avoid FK violations.
  lead_id: isUuid(lead_id) ? lead_id : null,
    text,
    role,
    sender,
  };

  // Use the service-role admin client for inserts so Row-Level Security doesn't block server-side writes.
  // Ensure a threads row exists for this event_id so the `messages.event_id` FK is satisfied.
  // Ensure a threads row exists for this event_id so the `messages.event_id` FK is satisfied.
  const { data: threadCheck, error: threadCheckErr } = await supabaseAdmin.from("threads").select("id").eq("id", event_id).maybeSingle();
  if (threadCheckErr && threadCheckErr.code !== "PGRST116") {
    // Unusual error looking up threads; log and surface it so it isn't swallowed.
    console.error("/api/chat threads lookup error:", { event_id, err: threadCheckErr });
    return NextResponse.json({ error: `threads lookup failed: ${threadCheckErr.message}` }, { status: 500 });
  }
  let createdThread: any = null;
  let createThreadErr: any = null;
  if (!threadCheck) {
    const ct = await supabaseAdmin.from("threads").insert([{ id: event_id, user_id: safeUserId, title: text?.slice?.(0, 120) || "Quick thread", role }]).select().maybeSingle();
    createdThread = ct.data ?? null;
    createThreadErr = ct.error ?? null;
    if (createThreadErr) {
      console.error("/api/chat create thread error:", { event_id, err: createThreadErr, payload });
      return NextResponse.json({ error: `failed to create thread: ${createThreadErr.message}`, debug: { payload, event_id, threadCheck: !!threadCheck, threadCheckErr: threadCheckErr?.message ?? null, createdThread, createThreadErr: createThreadErr?.message ?? null } }, { status: 500 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert([payload] as any)
    .select()
    .single();

  if (error) {
    // Return extra debug info for the client so the alert is actionable during testing.
    console.error("/api/chat insert message error:", { event_id, err: error, payload, threadCheckErr, createdThread, createThreadErr });
    return NextResponse.json(
      {
        error: error.message,
        debug: {
          payload,
          event_id,
          threadExists: !!threadCheck,
          threadCheckErr: threadCheckErr?.message ?? null,
          createdThread,
          createThreadErr: createThreadErr?.message ?? null,
          insertErr: { message: error.message, details: (error as any)?.details ?? null, code: (error as any)?.code ?? null },
        },
      },
      { status: 500 }
    );
  }

  // Attempt to generate an AI assistant reply server-side (best-effort).
  // This mirrors the logic in app/api/ai/complete but runs for the single message.
  try {
    if (!OPENAI_API_KEY) {
      // If no key: return the inserted message (and event id) without AI reply.
      return NextResponse.json({ message: data, event_id }, { status: 201 });
    }

    // Build history from recent messages for context (use admin client)
    const { data: msgs, error: mErr } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("event_id", event_id)
      .order("created_at", { ascending: true })
      .limit(20);

    if (mErr) {
      // return user message but log the AI error server-side
      console.warn("AI: failed to load history:", mErr.message);
      return NextResponse.json({ message: data }, { status: 201 });
    }

    const history = (msgs || []).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content || "",
    }));

    const system = `You are CAPITALIZE Assistant. Be helpful and concise.`;

    const payloadOpenAI = {
      model: MODEL,
      messages: [{ role: "system", content: system }, ...history],
      temperature: 0.4,
      max_tokens: 500,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payloadOpenAI),
    });

    if (!r.ok) {
      const t = await r.text();
      console.warn("OpenAI returned error:", t);
      return NextResponse.json({ message: data }, { status: 201 });
    }

    const j = await r.json();
    const aiText = j?.choices?.[0]?.message?.content?.trim() || "";

    if (aiText) {
      const { error: insErr } = await supabaseAdmin
        .from("messages")
        .insert([{ event_id, role: "assistant", content: aiText }]);
      if (insErr) console.warn("AI insert error:", insErr.message);
    }

    return NextResponse.json({ message: data, reply: aiText, event_id }, { status: 201 });
  } catch (e: any) {
    console.error("AI generation failed:", e?.message || e);
    return NextResponse.json({ message: data }, { status: 201 });
  }
}
