// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const MODEL = process.env.OPENAI_MODEL || "gpt-5";

// GET /api/chat?lead_id=<uuid>&limit=100
export async function GET(req: Request) {
  const supabase = getSupabase();

  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");
  const lead_id = searchParams.get("lead_id");
  const limit = Number(searchParams.get("limit") ?? 100);

  // If event_id is provided, return messages for that thread using admin client (avoids RLS mismatches)
  if (event_id) {
    const { data, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("event_id", event_id)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ messages: data ?? [] });
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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
  } catch {}

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const bodyEventId = body?.event_id ?? null;
  const lead_id = body?.lead_id ?? null; // legacy client may send thread id here
  const rawRole = typeof body?.role === "string" ? body.role : null;
  const ALLOWED_MSG_ROLES = ["user", "assistant", "system"];
  const role = ALLOWED_MSG_ROLES.includes(rawRole || "") ? (rawRole as string) : "user";
  const sender = body?.sender ?? role;
  const eventRole = typeof sender === "string" && sender ? sender : (typeof role === "string" ? role : "guide");

  // Enforce role domain: messages.role must be an actor: referrer | vendor | host | ai
  const ACTOR_ROLES = ["referrer", "vendor", "host", "ai"] as const;
  const userMsgRole = ACTOR_ROLES.includes(String(eventRole) as any) ? String(eventRole) : "ai";
  const assistantMsgRole = "ai";

  // Discover allowed message roles from the CHECK constraint, so we always satisfy it
  async function getAllowedRoles(): Promise<string[]> {
    try {
      const { data: tcs } = await supabaseAdmin
        .from('information_schema.table_constraints')
        .select('constraint_name')
        .eq('table_name', 'messages')
        .eq('constraint_type', 'CHECK');
      const checkNames = (tcs || []).map((t: any) => t.constraint_name);
      if (!checkNames?.length) return [];
      const { data: ccs } = await supabaseAdmin
        .from('information_schema.check_constraints')
        .select('constraint_name, check_clause')
        .in('constraint_name', checkNames);
      const clause = (ccs || []).find((c: any) => /role/i.test(c?.check_clause || ''))?.check_clause || '';
      const matches = clause.match(/'([^']+)'/g) || [];
      return Array.from(new Set(matches.map((s) => s.replace(/'/g, ''))));
    } catch {
      return [];
    }
  }

  const allowedRoles = await getAllowedRoles();
  const allowedSet = new Set(allowedRoles);
  // Final roles we will use for inserts based on DB CHECK constraint
  const pick = (...cands: string[]) => cands.find((c) => allowedSet.has(c));
  const desiredUserRole = pick(String(eventRole), 'user') || allowedRoles[0] || 'user';
  const desiredAssistantRole = pick('ai', 'assistant') || allowedRoles[0] || 'assistant';

  if (!text) {
    return NextResponse.json({ error: "Missing 'text' in request body" }, { status: 400 });
  }

  const isUuid = (s: any) => typeof s === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(s);
  const event_id = isUuid(bodyEventId)
    ? bodyEventId
    : (isUuid(lead_id) ? lead_id : (typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : randomUUID()));

  // Prefer authenticated user id from session if present
  let sessionUserId: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    sessionUserId = isUuid(user?.id) ? user!.id : null;
  } catch {}
  const safeUserIdBody = isUuid(body?.user_id) ? body.user_id : null;
  const rowUserId = sessionUserId || safeUserIdBody || null;

  const payload: any = {
    user_id: rowUserId,
    event_id,
    // Do not set lead_id from client thread id; avoid FK to leads
    lead_id: null,
    content: text,
    text: // back-compat for existing code reading messages.text
    role: desiredUserRole,
    sender,
  };

  // Ensure threads and events exist
  const { data: threadCheck, error: threadCheckErr } = await supabaseAdmin.from("threads").select("id").eq("id", event_id).maybeSingle();
  if (threadCheckErr && threadCheckErr.code !== "PGRST116") {
    console.error("/api/chat threads lookup error:", { event_id, err: threadCheckErr });
    return NextResponse.json({ error: `threads lookup failed: ${threadCheckErr.message}` }, { status: 500 });
  }
  let createdThread: any = null;
  let createThreadErr: any = null;
  if (!threadCheck) {
    const ct = await supabaseAdmin.from("threads").insert([{ id: event_id, user_id: rowUserId, title: text?.slice?.(0, 120) || "Quick thread", role: eventRole }]).select().maybeSingle();
    createdThread = ct.data ?? null;
    createThreadErr = ct.error ?? null;
    if (createThreadErr) {
      console.error("/api/chat create thread error:", { event_id, err: createThreadErr, payload });
      return NextResponse.json({ error: `failed to create thread: ${createThreadErr.message}`, debug: { payload, event_id, threadCheck: !!threadCheck, threadCheckErr: threadCheckErr?.message ?? null, createdThread, createThreadErr: createThreadErr?.message ?? null } }, { status: 500 });
    }
  }

  // Ensure events row exists since messages.event_id -> events.id
  let eventCheck: any = null;
  let eventCheckErr: any = null;
  let createdEvent: any = null;
  let createEventErr: any = null;
  try {
    const ev = await supabaseAdmin.from('events').select('id').eq('id', event_id).maybeSingle();
    eventCheck = ev.data ?? null;
    eventCheckErr = ev.error ?? null;
  } catch (e: any) {
    eventCheckErr = e;
  }
  if (!eventCheck) {
    // Schema requires events.title (text NOT NULL) and events.role (text NOT NULL)
    const titleVal = text?.slice?.(0, 120) || 'Quick event';
    const evc = await supabaseAdmin
      .from('events')
      .insert([{ id: event_id, title: titleVal, role: eventRole }])
      .select()
      .maybeSingle();

    createdEvent = evc.data ?? null;
    createEventErr = evc.error ?? null;
    if (createEventErr) {
      console.error('/api/chat create event error:', { event_id, err: createEventErr, payload });
      return NextResponse.json({ error: `failed to create event: ${createEventErr.message}`, debug: { payload, event_id, threadExists: !!threadCheck, threadCheckErr: threadCheckErr?.message ?? null, createdThread, createThreadErr: createThreadErr?.message ?? null, eventCheck: !!eventCheck, eventCheckErr: eventCheckErr?.message ?? null, createdEvent, createEventErr: createEventErr?.message ?? null } }, { status: 500 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert([payload] as any)
    .select()
    .single();

  if (error) {
    // If the failure is due to role check constraint, try an alternate mapping once
    let retried = false;
    let retryData: any = null;
    let retryError: any = null;
    const isRoleCheck = (error as any)?.code === '23514' && /messages_role_check/i.test((error as any)?.message || '');
    if (isRoleCheck) {
      try {
        const altRole = desiredUserRole;
        const altPayload = { ...payload, role: altRole };
        const r = await supabaseAdmin.from("messages").insert([altPayload] as any).select().single();
        retried = true;
        retryData = r.data;
        retryError = r.error;
        if (!r.error) {
          // Success on retry; proceed to AI reply using the same flow
          try {
            if (!OPENAI_API_KEY) {
              return NextResponse.json({ message: retryData, event_id, allowedRoles }, { status: 201 });
            }
            const { data: msgs } = await supabaseAdmin
              .from("messages")
              .select("*")
              .eq("event_id", event_id)
              .order("created_at", { ascending: true })
              .limit(20);
            const history = (msgs || []).map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content || "" }));
            const system = `You are CAPITALIZE Assistant. Be helpful and concise.`;
            const payloadOpenAI = { model: MODEL, messages: [{ role: "system", content: system }, ...history], temperature: 0.4, max_tokens: 500 };
            const rr = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify(payloadOpenAI) });
            let aiText = "";
            if (rr.ok) {
              const j = await rr.json();
              aiText = j?.choices?.[0]?.message?.content?.trim() || "";
              if (aiText) {
                const { error: insErr2 } = await supabaseAdmin.from("messages").insert([{ event_id, role: desiredAssistantRole, content: aiText, text: aiText }]);
                if (insErr2) aiText = ""; // do not send reply unless persisted
              }
            }
            return NextResponse.json({ message: retryData, reply: aiText, event_id, allowedRoles }, { status: 201 });
          } catch (e: any) {
            return NextResponse.json({ message: retryData, event_id, allowedRoles }, { status: 201 });
          }
        }
      } catch {}
    }

    // Return extra debug info for the client so the alert is actionable during testing.
    // Also include CHECK constraints definition for `messages` to show allowed roles.
    let fkInfo: any = null;
    let checkInfo: any = null;
    try {
      const { data: kcus, error: kcuErr } = await supabaseAdmin
        .from('information_schema.key_column_usage')
        .select('*')
        .eq('table_name', 'messages')
        .eq('constraint_schema', 'public');
      if (!kcuErr) {
        const constraintNames = (kcus || []).map((k: any) => k.constraint_name).filter(Boolean);
        let ccus: any[] = [];
        if (constraintNames.length) {
          const { data: ccud } = await supabaseAdmin
            .from('information_schema.constraint_column_usage')
            .select('*')
            .in('constraint_name', constraintNames);
          ccus = ccud || [];
        }
        fkInfo = (kcus || []).map((k: any) => {
          const ref = ccus.find((c: any) => c.constraint_name === k.constraint_name) || null;
          return { constraint_name: k.constraint_name, local_column: k.column_name, referenced_table: ref?.table_name ?? null, referenced_column: ref?.column_name ?? null };
        });
      }
      const { data: tcs2 } = await supabaseAdmin
        .from('information_schema.table_constraints')
        .select('constraint_name')
        .eq('table_name', 'messages')
        .eq('constraint_type', 'CHECK');
      const checkNames2 = (tcs2 || []).map((t: any) => t.constraint_name);
      if (checkNames2.length) {
        const { data: ccs2 } = await supabaseAdmin
          .from('information_schema.check_constraints')
          .select('constraint_name, check_clause')
          .in('constraint_name', checkNames2);
        checkInfo = ccs2 || [];
      }
    } catch {}

    console.error("/api/chat insert message error:", { event_id, err: error, payload });
    return NextResponse.json(
      {
        error: error.message,
        debug: {
          payload,
          event_id,
          allowedRoles,
          insertErr: { message: error.message, details: (error as any)?.details ?? null, code: (error as any)?.code ?? null },
          retried,
          retryErr: retryError ? { message: retryError.message, code: retryError.code } : null,
          fkInfo,
          checkInfo,
        },
      },
      { status: 500 }
    );
  }

  // Generate assistant reply server-side
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ message: data, event_id, allowedRoles }, { status: 201 });
    }

    const { data: msgs } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("event_id", event_id)
      .order("created_at", { ascending: true })
      .limit(20);

    // Map DB roles to OpenAI roles: our assistant rows use role='ai'
    const history = (msgs || []).map((m: any) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content || "",
    }));

    const system = `You are CAPITALIZE Assistant. Be helpful and concise.`;

    const payloadOpenAI = {
      model: MODEL,
      messages: [{ role: "system", content: system }, ...history],
      temperature: 0.4,
      max_tokens: 500,
    };

    let r = await fetch("https://api.openai.com/v1/chat/completions", {
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
      // Fallback once to a widely available model
      try {
        const fallback = { ...payloadOpenAI, model: "gpt-4o-mini" };
        r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: JSON.stringify(fallback),
        });
      } catch {}
      if (!r.ok) {
        const t2 = await r.text().catch(() => "");
        return NextResponse.json({ message: data, event_id, allowedRoles, aiError: t || t2 }, { status: 201 });
      }
    }

    const j = await r.json();
    const aiText = j?.choices?.[0]?.message?.content?.trim() || "";

    let replyOut = "";
    let aiInsertErr: any = null;
    if (aiText) {
      const { error: insErr } = await supabaseAdmin
        .from("messages")
        .insert([{ event_id, role: desiredAssistantRole, content: aiText, text: aiText }]);
      if (!insErr) replyOut = aiText; else aiInsertErr = { message: insErr.message, code: (insErr as any)?.code };
    }

    return NextResponse.json({ message: data, reply: replyOut, event_id, allowedRoles, aiInsertErr }, { status: 201 });
  } catch (e: any) {
    console.error("AI generation failed:", e?.message || e);
    return NextResponse.json({ message: data, event_id, allowedRoles }, { status: 201 });
  }
}
