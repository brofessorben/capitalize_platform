// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseClient";

const BULLET = "•";

// Tiny live search via SerpAPI (optional)
async function vendorSearch(q: string) {
  try {
    const key = process.env.SERPAPI_KEY;
    if (!key) return null;

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", q);
    url.searchParams.set("num", "5");
    url.searchParams.set("api_key", key);

    const r = await fetch(url.toString(), { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();

    const items:
      | Array<{ title: string; link: string; snippet?: string }>
      | undefined = j?.organic_results?.slice(0, 5)?.map((o: any) => ({
      title: o.title,
      link: o.link,
      snippet: o.snippet,
    }));

    if (!items?.length) return null;

    const lines = items
      .map(
        (it) =>
          `${BULLET} ${it.title}\n  ${it.link}${it.snippet ? `\n  ${it.snippet}` : ""}`
      )
      .join("\n\n");

    return `Web results:\n${lines}`;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_id, role, content } = body as {
      event_id: string;
      role: "referrer" | "vendor" | "host" | "assistant" | string;
      content: string;
    };

    // Server-side Supabase (with auth)
    const supabase = getServerSupabase();

    // Who is calling?
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // Normalize role coming from client
    const safeRole: "referrer" | "vendor" | "host" =
      role === "vendor" || role === "host" ? role : "referrer";

    // 1) SAVE THE USER'S MESSAGE FIRST
    if (content && content.trim()) {
      const { error: insertUserErr } = await supabase.from("messages").insert([
        {
          event_id,
          user_id: user.id,
          role: safeRole,
          content: content.trim(),
        },
      ]);
      if (insertUserErr) {
        console.error("insert user message error:", insertUserErr);
        // not fatal, but let’s surface
      }
    }

    // 2) OPTIONAL: quick live lookup if it sounds like discovery
    let liveNote: string | null = null;
    if (/find|vendors?|menus?|bbq|food truck|cater|availability|quote/i.test(content)) {
      liveNote = await vendorSearch(content);
    }

    // 3) STYLE RULES for AI output (plain text, real bullets, short headings, end w/ Next step)
    const system =
      "You are CAPITALIZE, an event ops co-pilot for referrers, vendors, and hosts. Output MUST be plain text (no markdown markers, no **). Use real bullets with '• '. Use short section titles with a trailing colon, each on its own line (e.g., 'Plan:' then bullets). Prefer concise lists. Use tasteful emojis sparingly. Always end with exactly one 'Next step:' line.";

    // Build brief context from recent thread history
    const { data: history } = await supabase
      .from("messages")
      .select("role, content, user_id")
      .eq("event_id", event_id)
      .order("created_at", { ascending: true })
      .limit(30);

    const messages = [
      { role: "system", content: system },
      ...(history || []).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      {
        role: "user",
        content: content + (liveNote ? `\n\n${liveNote}` : ""),
      },
    ];

    // 4) Call OpenAI
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.35,
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("OpenAI error", errText);
      throw new Error("AI call failed");
    }

    const j = await r.json();
    const reply: string = j.choices?.[0]?.message?.content?.trim() || "Done.";

    // 5) SAVE THE ASSISTANT REPLY
    const { error: insertAiErr } = await supabase.from("messages").insert([
      { event_id, role: "assistant", content: reply },
    ]);
    if (insertAiErr) {
      console.error("insert assistant message error:", insertAiErr);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message || "fail" },
      { status: 500 }
    );
  }
}
