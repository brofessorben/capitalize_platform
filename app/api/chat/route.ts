import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SERPAPI_KEY = process.env.SERPAPI_KEY || ""; // optional live search

// --- helpers -------------------------------------------------------
function serverSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

async function serpSearch(q: string) {
  if (!SERPAPI_KEY) return null;
  const url =
    `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&num=5&api_key=${SERPAPI_KEY}`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) return null;
  const j = await r.json();
  const items: Array<{ title: string; link: string; snippet?: string }> =
    (j?.organic_results || []).slice(0, 5).map((o: any) => ({
      title: o.title, link: o.link, snippet: o.snippet,
    }));
  if (!items.length) return null;
  const lines = items.map((it, i) => `[${i + 1}] ${it.title} — ${it.link}${it.snippet ? `\n${it.snippet}` : ""}`);
  return { text: lines.join("\n\n"), items };
}

function nextSuggestions(role: string, last: string) {
  const base = [
    "What are 3 next steps?",
    "Turn this into a text I can send",
    "Draft a quick outreach blurb",
    "Find 3 local vendors with menus",
  ];
  if (/menu|price|pricing|cost|quote/i.test(last)) {
    return ["Pull sample menus with pricing", "Summarize pricing ranges", "Draft a budget-friendly option", "Ask for availability"];
  }
  if (/availability|date/i.test(last)) {
    return ["Write a polite availability check", "Offer 2–3 backup dates", "Draft a fast follow-up"];
  }
  if (role === "vendor") {
    return ["Make good/better/best packages", "Ask 5 clarifying questions", "Turn into proposal", "Create a task checklist"];
  }
  if (role === "host") {
    return ["Turn this into a vendor request", "Suggest 3 matching vendors", "Create a simple timeline", "List hidden costs"];
  }
  return base;
}

// --- OpenAI call ---------------------------------------------------
async function askOpenAI(userMsg: string, role: string, webContext?: string) {
  const system = [
    "You are CAPITALIZE's co-pilot.",
    "Tone: confident, fast, sales-savvy, useful. Bullet where helpful. Keep it tight.",
    "If web_context is provided, use it and cite as [1], [2]… right after facts. Give short, trustworthy links.",
  ].join(" ");

  const content = webContext
    ? `User message:\n${userMsg}\n\nweb_context:\n${webContext}`
    : userMsg;

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    }),
  });
  if (!r.ok) throw new Error(`OpenAI error ${r.status}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || "Done.";
}

// --- route ---------------------------------------------------------
export async function POST(req: Request) {
  try {
    const { thread_id, role, content, allow_web = true } = await req.json();
    if (!thread_id) return NextResponse.json({ ok: false, error: "thread_id required" }, { status: 400 });
    if (!content?.trim()) return NextResponse.json({ ok: false, error: "content required" }, { status: 400 });

    const supabase = serverSupabase();

    // 1) insert user's message
    await supabase.from("messages").insert({
      event_id: thread_id,
      role: role || "referrer",
      content: content.trim(),
    });

    // 2) optional live search
    let webCtx: string | undefined;
    if (allow_web) {
      // lightweight heuristic to decide when to search
      const should = /find|who|what|menu|price|cost|best|near|in\s+[A-Z]/i.test(content) || /\?/.test(content);
      if (should) {
        const res = await serpSearch(content);
        if (res) webCtx = res.text;
      }
    }

    // 3) call OpenAI
    const reply = await askOpenAI(content, role || "referrer", webCtx);

    // 4) save assistant message
    const { error: insertErr } = await supabase.from("messages").insert({
      event_id: thread_id,
      role: "assistant",
      content: reply,
    });
    if (insertErr) throw insertErr;

    // 5) suggestions back to client
    const suggestions = nextSuggestions(role || "referrer", content);

    return NextResponse.json({ ok: true, reply, suggestions });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "chat failed" }, { status: 500 });
  }
}
