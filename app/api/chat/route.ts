// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { role = "referrer", event_id = null, content = "" } = await req.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // 1) Save the user's message
    const { error: insertErr } = await supabase.from("messages").insert({
      role, content, event_id,
    });
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // 2) Pull some recent context (latest 20 in this thread/role mix)
    const { data: recent, error: fetchErr } = await supabase
      .from("messages")
      .select("role, content")
      .order("created_at", { ascending: false })
      .limit(20);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    // 3) Build a compact conversation window
    const history = (recent ?? []).reverse();

    // 4) Role-aware system prompt
    const system =
      role === "vendor"
        ? "You are CAPITALIZE's vendor co-pilot. Be punchy, helpful, and sales-forward. Write crisp bullets, offers, and follow-ups."
        : role === "host"
        ? "You are CAPITALIZE's host planner. Be friendly, efficient, and organized. Give next steps and smart vendor asks."
        : "You are CAPITALIZE's referrer co-pilot. Draft intros, outreach, and tighten messages. Keep it concise and persuasive.";

    // 5) Call OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system + " Always avoid brackets like [1], link lists, or filler. Use bold section headers sparingly and bullets." },
        ...history.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
      ],
      temperature: 0.6,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ error: txt }, { status: 500 });
    }

    const json = await resp.json();
    const reply = json?.choices?.[0]?.message?.content?.trim() || "Done.";

    // 6) Save assistant reply
    const { error: saveErr } = await supabase.from("messages").insert({
      role: "assistant",
      content: reply,
      event_id,
    });
    if (saveErr) {
      return NextResponse.json({ error: saveErr.message }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
