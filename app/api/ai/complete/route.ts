// app/api/ai/complete/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MODEL = process.env.OPENAI_MODEL || "gpt-5";

interface Message {
  role: string;
  content: string;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  referrer: `You are CAPITALIZE's Referrer Assistant. Be concise and actionable. Goal: help draft intros, summarize leads, propose next steps, and write tight follow-ups.`,
  vendor: `You are CAPITALIZE's Vendor Assistant. Help craft proposals, pricing summaries, and clear responses. Keep everything professional and decisive.`,
  host: `You are CAPITALIZE's Host Assistant. Help clarify needs, compare vendors, and confirm event details. Be friendly and organized.`,
  default: `You are CAPITALIZE Assistant. Be helpful and concise.`,
};

export async function POST(req: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    const body = (await req.json()) as { event_id?: string; role?: string };
    const event_id = body?.event_id;
    const role = body?.role || "referrer";

    if (!event_id) {
      return NextResponse.json({ error: "event_id required" }, { status: 400 });
    }

    // Get last 20 messages for context
    const { data: msgs, error: mErr } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("event_id", event_id)
      .order("created_at", { ascending: true })
      .limit(20);

    if (mErr) {
      return NextResponse.json({ error: mErr.message }, { status: 500 });
    }

    const history: Message[] = (msgs || []).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content || "",
    }));

    const system = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.default;

    const payload = {
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
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ error: `OpenAI error: ${t}` }, { status: 500 });
    }

    const j = await r.json();
    const aiText = j?.choices?.[0]?.message?.content?.trim() || "…";

    // Ensure thread exists (best-effort)
    try {
      const { data: threadCheck } = await supabaseAdmin.from("threads").select("id").eq("id", event_id).maybeSingle();
      if (!threadCheck) {
        await supabaseAdmin.from("threads").insert([{ id: event_id, user_id: null, title: "AI thread" }]);
      }
    } catch (e) {
      console.error("ai/complete threads check error:", (e as any)?.message || e);
    }

    const { error: insErr } = await supabaseAdmin
      .from("messages")
      .insert([{ event_id, role: "assistant", content: aiText, text: aiText }]);

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unknown error" }, { status: 500 });
  }
}
