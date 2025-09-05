// pages/api/chat.js
import OpenAI from "openai";
import { systemPrompt } from "../../lib/systemPrompt"; // named export

export const config = {
  api: { bodyParser: true },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------- helpers ---------------------------------------------------------

function stripPolite(text) {
  // trims leading “please/hey/can you” type fluff so queries are cleaner
  return String(text || "")
    .replace(/^\s*(hey|hi|hello|please|can you|could you|would you)\b[:,\s]*/i, "")
    .trim();
}

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
      (r, i) => `${i + 1}. [${r.title}](${r.link})  \n   ${r.snippet ?? ""}`
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
        }  \n   ${r.snippet ?? ""}`
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

  // Fallback to web if Places has nothing
  if (!results.length) {
    return await doWebSearch(query);
  }

  const lines = results.map((p, i) => {
    const mapLink = `https://www.google.com/maps/place/?q=place_id:${p.place_id}`;
    const rating =
      p.rating && p.total_ratings ? ` — ${p.rating}★ (${p.total_ratings})` : "";
    return `${i + 1}. **${p.name}**${rating}  \n   ${p.address}  \n   ${mapLink}`;
  });

  return ["**Google Maps results for:** " + query, "", ...lines].join("\n");
}

// Simple intent detector for natural language (non-slash) prompts
function detectIntent(text) {
  const lower = text.toLowerCase();

  // Strong signals for web search
  if (
    /(^|\b)(menu|review|reviews|hours|website|url|contact|price|pricing|quote|news|article|press|tweet|twitter|instagram|facebook)\b/.test(
      lower
    )
  ) {
    return { type: "search", query: stripPolite(text) };
  }

  // If it names a place/business or “find … in <city>” → try maps
  if (/\b(find|near|in|at)\b.*\b(restaurant|truck|vendor|bar|cafe|cater|venue|hotel|grille|grill|bbq|food)\b/.test(lower)) {
    return { type: "maps", query: stripPolite(text) };
  }

  // Generic “what’s happening today / latest / broke / announced” → news
  if (/\b(today|latest|headline|breaking|announced|tweet(?:ed)?|post(?:ed)?)\b/.test(lower)) {
    return { type: "news", query: stripPolite(text) };
  }

  // Default: no special intent, let OpenAI handle it
  return { type: "chat" };
}

// ---------- main handler ----------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], role = "referrer" } = req.body || {};
    const last = messages[messages.length - 1];
    const userText = (last && last.content) || "";

    // explicit slash commands
    const slash = userText.trim().match(/^\/(search|news|maps)\s+(.+)/i);
    if (slash) {
      const [, cmd, queryRaw] = slash;
      const query = stripPolite(queryRaw);
      let md;
      if (cmd === "search") md = await doWebSearch(query);
      else if (cmd === "news") md = await doNewsSearch(query);
      else md = await doMapsSearch(query);
      return res.status(200).json({ reply: md });
    }

    // natural language intent → route before model
    const intent = detectIntent(userText);
    if (intent.type === "search") {
      return res.status(200).json({ reply: await doWebSearch(intent.query) });
    }
    if (intent.type === "news") {
      return res.status(200).json({ reply: await doNewsSearch(intent.query) });
    }
    if (intent.type === "maps") {
      return res.status(200).json({ reply: await doMapsSearch(intent.query) });
    }

    // standard chat with OpenAI
    const sys = [
      systemPrompt,
      "",
      `User role: ${role}`,
      "Use clean formatting (headings, bullets). If the user asks for live info, suggest `/search`, `/news`, or `/maps` unless you already routed it.",
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
    // Return a normal 200 with a friendly inline message so the UI stays calm
    return res.status(200).json({
      reply:
        "_Couldn’t reach the server. Try again in a moment. If this keeps happening, ping the team._",
    });
  }
      }
