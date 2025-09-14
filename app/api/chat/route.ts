// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const BULLET = "•";

// Optional: quick “live” web search via SerpAPI
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
    // Build a Supabase *server* client bound to the user's auth cookies
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {
            // next/headers cookies are read-only during route handlers
          },
          remove() {
            // read-only
          },
        },
      }
    );

    // Get the logged-in user (required for per-user threads + RLS)
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Not signed in" },
        { status: 401 }
      );
    }

    // Read request
    const body = await req.json();
    const { event_id, role, content } = body as {
      event_id: string;
      role: string;
      content: string;
    };

    // Optional “live” lookup
    let liveNote: string | null = null;
    if (/find|vendors?|menus?|bbq|food truck|cater|availability|quote/i.test(content)) {
      liveNote = await vendorSearch(content);
    }

    // Style/system prompt (unchanged)
    const system =
      "You are CAPITALIZE, an event ops co-pilot for referrers, vendors, and hosts. Output MUST be plain text (no markdown markers, no **). Use real bullets with '• '. Use short section titles with a trailing colon, each on its own line (e.g., 'Plan:' then bullets). Prefer concise lists. Use tasteful emojis sparingly. Always end with exactly one 'Next step:' line.";

    // Pull the last ~30 messages for THIS user + THIS event_id
    const { data: historyRows } = await supabase
      .from("messages")
      .select("sender, role, text, created_at")
      .eq("event_id", event_id)
      .eq("user_id", user.id) // << key line: isolate by user
      .order("created_at", { ascending: true })
      .limit(30);

    const history =
      historyRows?.map((m) => ({
        role: m.sender === "ai" ? "assistant" : "user",
        content: m.text,
      })) ?? [];

    const messages = [
      { role: "system", content: system },
      ...history,
      { role: "user", content: content + (liveNote ? `\n\n${liveNote}` : "") },
    ];

    // Call OpenAI
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

    // Insert the assistant's reply WITH user_id so RLS passes
    const { error: insertErr } = await supabase.from("messages").insert([
      {
        event_id,
        user_id: user.id, // << important
        sender: "ai",
        role: "assistant",
        text: reply,
      },
    ]);

    if (insertErr) {
      console.error("Insert error", insertErr);
      throw insertErr;
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
