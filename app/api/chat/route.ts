// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseClient";

const BULLET = "•"; // real bullet character

// tiny “live” web search via SerpAPI (optional)
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

    // plain text with real bullets — no markdown
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
      role: string;
      content: string;
    };

    const supabase = getServerSupabase();

    // get the current authed user (needed for per-user history + writes)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    if (!user?.id) throw new Error("Not authenticated");

    // opportunistic live search if it sounds like discovery
    let liveNote: string | null = null;
    if (/find|vendors?|menus?|bbq|food truck|cater|availability|quote/i.test(content)) {
      liveNote = await vendorSearch(content);
    }

    /**
     * STYLE RULES (AI):
     * - Output MUST be plain text (no markdown markers, no **).
     * - Use real bullets with "• " (one per line).
     * - Short section titles with a trailing colon, on their own line (e.g., "Plan:").
     * - Prefer concise lists; tasteful emojis only if they add clarity.
     * - Always end with exactly one "Next step:" line.
     */
    const system =
      "You are CAPITALIZE, an event ops co-pilot for referrers, vendors, and hosts. Output MUST be plain text (no markdown markers, no **). Use real bullets with '• '. Use short section titles with a trailing colon, each on its own line. Prefer concise lists. Use tasteful emojis sparingly. Always end with exactly one 'Next step:' line.";

    // pull last 30 messages for THIS user + THIS event
    const { data: history, error: histErr } = await supabase
      .from("messages")
      .select("role, content")
      .eq("event_id", event_id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(30);

    if (histErr) throw histErr;

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

    // OpenAI call
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

    // store assistant reply with user_id
    const { error: insertErr } = await supabase.from("messages").insert([
      {
        event_id,
        role: "assistant",
        content: reply,
        user_id: user.id,
      },
    ]);
    if (insertErr) throw insertErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message || "fail" },
      { status: 500 }
    );
  }
}
