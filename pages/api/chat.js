// pages/api/chat.js
import OpenAI from "openai";
import { systemPrompt } from "../../lib/systemPrompt";

export const config = {
  api: { bodyParser: true },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------- helpers ---------------------------------------------------------

async function doWebSearch(query) {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY missing");

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", "5");
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", key);

  const r = await fetch(url, { next: { revalidate: 60 } });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`serpapi web failed: ${r.status} ${txt}`);
  }
  const j = await r.json();

  const results = (j.organic_results || []).slice(0, 5).map((it) => ({
    title: it.title,
    link: it.link,
    snippet: it.snippet,
  }));

  if (!results.length) return "_No web results found._";

  return [
    `**Web results for:** ${query}`,
    "",
    ...results.map(
      (r, i) =>
        `${i + 1}. [${r.title}](${r.link})  \n   ${r.snippet ? r.snippet : ""}`
    ),
  ].join("\n");
}

async function doNewsSearch(query) {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY missing");

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_news");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
  url.searchParams.set("num", "5");
  url.searchParams.set("api_key", key);

  const r = await fetch(url, { next: { revalidate: 60 } });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`serpapi news failed: ${r.status} ${txt}`);
  }
  const j = await r.json();

  const results = (j.news_results || []).slice(0, 5).map((it) => ({
    title: it.title,
    link: it.link,
    source: it.source,
    date: it.date,
    snippet: it.snippet,
  }));

  if (!results.length) return "_No recent articles found._";

  return [
    `**News for:** ${query}`,
    "",
    ...results.map(
      (r, i) =>
        `${i + 1}. [${r.title}](${r.link}) — ${r.source}${
          r.date ? ` (${r.date})` : ""
        }  \n   ${r.snippet ? r.snippet : ""}`
    ),
  ].join("\n");
}

async function doMapsSearch(query) {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_KEY missing");

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/textsearch/json"
  );
  url.searchParams.set("query", query);
  url.searchParams.set("key", key);

  const r = await fetch(url, { next: { revalidate: 300 } });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`google places failed: ${r.status} ${txt}`);
  }
  const j = await r.json();

  const results = (j.results || []).slice(0, 12).map((p) => ({
    name: p.name,
    address: p.formatted_address,
    rating: p.rating,
    total_ratings: p.user_ratings_total,
    place_id: p.place_id,
  }));

  if (!results.length) return "_No places found._";

  const lines = results.map((p, i) => {
    const mapLink = `https://www.google.com/maps/place/?q=place_id:${p.place_id}`;
    const rating =
      p.rating && p.total_ratings
        ? ` — ${p.rating}★ (${p.total_ratings})`
        : "";
    return `${i + 1}. **${p.name}**${rating}  \n   ${p.address}  \n   ${mapLink}`;
  });

  return ["**Google Maps results for:** " + query, "", ...lines].join("\n");
}

// ---------- handler ---------------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], role = "referrer" } = req.body || {};
    const last = messages[messages.length - 1];
    const userText = (last && last.content) || "";

    // Slash commands (return early)
    const slash = userText.trim().match(/^\/(search|news|maps)\s+(.+)/i);
    if (slash) {
      const [, cmd, query] = slash;
      try {
        if (cmd === "search") {
          const md = await doWebSearch(query);
          return res.status(200).json({ reply: md });
        }
        if (cmd === "news") {
          const md = await doNewsSearch(query);
          return res.status(200).json({ reply: md });
        }
        // maps
        const md = await doMapsSearch(query);
        return res.status(200).json({ reply: md });
      } catch (e) {
        console.error("slash-command error:", e);
        return res
          .status(200)
          .json({ reply: "_Search failed. Try again in a minute._" });
      }
    }

    // Heuristic: if user explicitly asks for current info, push them to slash search
    if (/\b(today|latest|current|menu|hours|address|reviews?)\b/i.test(userText)) {
      // Nudge but still answer with OpenAI if they ignore it
      const tip =
        "_Tip: for live results use `/search your query`, `/news your topic`, or `/maps your place`._\n\n";
      const sys = [
        systemPrompt,
        "",
        `User role: ${role}`,
        "Use clean headings & bullets. Be action-forward.",
      ].join("\n");

      const chat = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: sys },
          ...messages.map((m) => ({
            role: m.role === "assistant" || m.role === "ai" ? "assistant" : m.role,
            content: String(m.content ?? ""),
          })),
        ],
      });

      const reply =
        chat.choices?.[0]?.message?.content?.trim() ||
        "I’m here—share details and I’ll draft the next message.";
      return res.status(200).json({ reply: tip + reply });
    }

    // Normal chat flow
    const sys = [
      systemPrompt,
      "",
      `User role: ${role}`,
      "Keep responses crisp, structured (use headings & bullets), and action-forward.",
    ].join("\n");

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: sys },
        ...messages.map((m) => ({
          role: m.role === "assistant" || m.role === "ai" ? "assistant" : m.role,
          content: String(m.content ?? ""),
        })),
      ],
    });

    const reply =
      chat.choices?.[0]?.message?.content?.trim() ||
      "I’m here—share details and I’ll draft the next message.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("api/chat error:", err);
    return res.status(200).json({
      reply:
        "_Couldn’t reach the server. Try again in a moment. If this keeps happening, check Logs in Vercel._",
    });
  }
}
