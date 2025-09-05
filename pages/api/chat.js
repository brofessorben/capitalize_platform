// pages/api/chat.js
import OpenAI from "openai";
import { systemPrompt } from "@/lib/systemPrompt"; // <-- named export

export const config = {
  api: { bodyParser: true },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---- helpers ---------------------------------------------------------------

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
  if (!r.ok) throw new Error("serpapi web request failed");
  const j = await r.json();

  const results = (j.organic_results || []).slice(0, 5).map((r) => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet,
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
  if (!r.ok) throw new Error("serpapi news request failed");
  const j = await r.json();

  const results = (j.news_results || []).slice(0, 5).map((r) => ({
    title: r.title,
    link: r.link,
    source: r.source,
    date: r.date,
    snippet: r.snippet,
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
  if (!r.ok) throw new Error("google places request failed");
  const j = await r.json();

  const results = (j.results || []).slice(0, 8).map((p) => ({
    name: p.name,
    address: p.formatted_address,
    rating: p.rating,
    total_ratings: p.user_ratings_total,
    place_id: p.place_id,
  }));

  if (!results.length) return "_No places found._";

  // Links to the Google Maps place by place_id
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

// ---- main handler ----------------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], role = "referrer" } = req.body || {};
    const last = messages[messages.length - 1];
    const userText = (last && last.content) || "";

    // Slash commands
    // /search query    -> web search via SerpAPI (Google)
    // /news query      -> news via SerpAPI (Google News)
    // /maps query      -> Google Places textsearch
    const slash = userText.trim().match(/^\/(search|news|maps)\s+(.+)/i);
    if (slash) {
      const [, cmd, query] = slash;
      let md;
      if (cmd === "search") md = await doWebSearch(query);
      else if (cmd === "news") md = await doNewsSearch(query);
      else md = await doMapsSearch(query);
      return res.status(200).json({ reply: md });
    }

    // Normal chat -> OpenAI
    const sys = [
      systemPrompt,
      "",
      `User role: ${role}`,
      "Keep responses crisp, structured (use headings & bullets when useful), and action-forward.",
    ].join("\n");

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini", // fast + cheap; swap if you prefer
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
    return res
      .status(200)
      .json({
        reply:
          "_Couldn’t reach the server. Try again in a moment. If this keeps happening, ping the team._",
      });
  }
      }
