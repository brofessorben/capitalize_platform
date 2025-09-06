import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabaseClient";

// very small helper “live” search
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
    const j = await r.json();
    const items: Array<{ title: string; link: string; snippet?: string }> =
      j?.organic_results?.slice(0, 5)?.map((o: any) => ({
        title: o.title,
        link: o.link,
        snippet: o.snippet,
      })) ?? [];

    if (!items.length) return null;

    const lines = items
      .map(
        (it, i) =>
          `${i + 1}. ${it.title}\n   ${it.link}${it.snippet ? `\n   ${it.snippet}` : ""}`
      )
      .join("\n\n");

    return `BBQ intel drop 🔥 — Web results for: ${q}\n\n${lines}`;
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

    // optional: if user asks to "find", try quick live search first
    let liveNote: string | null = null;
    if (/find|vendors?|menus?|bbq|food truck|cater/i.test(content)) {
      liveNote = await vendorSearch(content);
    }

    const system =
      "You are CAPITALIZE, an event ops co-pilot. Write concise, useful, deal-closing replies with a friendly, confident tone. If given web snippets, synthesize them. Bullets > paragraphs. End with one crisp next step.";

    // build simple conversation context from last 30 messages
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("event_id", event_id)
      .order("created_at", { ascending: true })
      .limit(30);

    const messages = [
      { role: "system", content: system },
      ...(history || []).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      { role: "user", content: content + (liveNote ? `\n\n${liveNote}` : "") },
    ];

    // call OpenAI (Responses API compatible with gpt-4o-mini)
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("OpenAI error", errText);
      throw new Error("AI call failed");
    }

    const j = await r.json();
    const reply: string = j.choices?.[0]?.message?.content ?? "Done.";

    // store assistant reply
    await supabase
      .from("messages")
      .insert([{ event_id, role: "assistant", content: reply }]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || "fail" }, { status: 500 });
  }
}
