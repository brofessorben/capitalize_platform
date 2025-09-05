// pages/api/chat.js
import OpenAI from "openai";
import { systemPrompt } from "../../lib/systemPrompt"; // named export

export const config = {
  api: { bodyParser: true },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ----------------------------- helpers: search ----------------------------- */

async function doWebSearch(query) {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY missing");

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", "5");
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", key);

  const r = await fetch(url);
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

  const r = await fetch(url);
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

  const r = await fetch(url);
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

/* ------------------------- helpers: intent detection ----------------------- */

function cleanText(text = "") {
  return String(text)
    .replace(/^`+|`+$/g, "") // strip backticks if pasted
    .replace(/^"+|"+$/g, "") // strip quotes if pasted
    .trim();
}

function stripPolitePreamble(s) {
  // remove leading “can you”, “please”, etc.
  return s
    .replace(
      /^(can you|could you|please|pls|hey|yo|hi|okay|ok|would you|i need|find me|look up)\b[\s,:-]*/i,
      ""
    )
    .trim();
}

function detectIntent(raw) {
  const text = cleanText(raw);
  const lower = text.toLowerCase();

  // explicit slash commands always win
  const slash = lower.match(/^\/(search|news|maps)\s+(.+)/i);
  if (slash) {
    return { type: slash[1], query: cleanText(slash[2]) };
  }

  // very lightweight heuristics

  // NEWS: mentions of news-y words or public figures + “today/this week/latest”
  if (
    /(news|headline|breaking|tweet|twitter|x\.com|latest|today|this week)/i.test(
      lower
    )
  ) {
    return { type: "news", query: stripPolitePreamble(text) };
  }

  // MAPS: “near me”, “in <city>”, or venue-type words
  if (
    /(near me|address|directions|map|maps|in [a-z\s]+|nearby)/i.test(lower) ||
    /(restaurant|cater|caterer|bar|venue|hotel|food truck|truck|bbq|grille|grill|coffee|bakery|pizza|tacos)/i.test(
      lower
    )
  ) {
    return { type: "maps", query: stripPolitePreamble(text) };
  }

  // WEB: “menu, hours, phone, reviews, price, what is, who is, website”
  if (
    /(menu|hours|reviews|rating|website|phone|email|price|what is|who is|how to|official site)/i.test(
      lower
    )
  ) {
    return { type: "search", query: stripPolitePreamble(text) };
  }

  // If message starts with “find / search / look up”
  if (/^(find|search|look up|google)\b/i.test(lower)) {
    return {
      type: "search",
      query: lower.replace(/^(find|search|look up|google)\b/i, "").trim(),
    };
  }

  return { type: "chat" };
}

/* --------------------------------- handler -------------------------------- */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], role = "referrer" } = req.body || {};
    const last = messages[messages.length - 1];
    const userText = (last && last.content) || "";

    // decide what to do
    const intent = detectIntent(userText);

    if (intent.type === "search") {
      const md = await doWebSearch(intent.query);
      return res.status(200).json({ reply: md });
    }
    if (intent.type === "news") {
      const md = await doNewsSearch(intent.query);
      return res.status(200).json({ reply: md });
    }
    if (intent.type === "maps") {
      const md = await doMapsSearch(intent.query);
      return res.status(200).json({ reply: md });
    }

    // Normal chat → OpenAI
    const sys = [
      systemPrompt,
      "",
      `User role: ${role}`,
      "Keep responses crisp, structured (use headings & bullets when useful), and action-forward.",
    ].join("\n");

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: sys },
        ...messages.map((m) => ({
          role:
            m.role === "assistant" || m.role === "ai" ? "assistant" : m.role,
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
        "_Couldn’t reach the server. Try again in a moment. If this keeps happening, ping the team._",
    });
  }
}
