// pages/api/chat.js
import OpenAI from "openai";
import { systemPrompt } from "@/lib/systemPrompt"; // named export

export const config = {
  api: { bodyParser: true },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ───────────────────────── helpers ─────────────────────────

function parseCityFromQuery(q) {
  // “… in Nashville”, “… near Nashville, TN”
  const m = q.match(/\b(?:in|near)\s+([A-Za-z .'-]+?)(?:,?\s*[A-Z]{2})?\b/i);
  return m ? m[1].trim() : null;
}

function isLocalIntent(q) {
  const s = (q || "").toLowerCase();
  return (
    /\b(find|near|near me|closest|best)\b/.test(s) ||
    /\b(bbq|barbecue|truck|food truck|cater|caterer|vendor|restaurant|bar|venue|coffee|bakery|pizza|taco|dessert|pop-up)\b/.test(s) ||
    /\b(in|near)\s+[a-z]/i.test(s)
  );
}

async function doWebSearch(query) {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY missing");

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", "5");
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
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

// SerpAPI Google Local (map pack)
async function doLocalSearch(query) {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY missing");

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_local");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
  url.searchParams.set("num", "10");
  const city = parseCityFromQuery(query);
  if (city) url.searchParams.set("location", city);
  url.searchParams.set("api_key", key);

  const r = await fetch(url, { next: { revalidate: 120 } });
  if (!r.ok) throw new Error("serpapi local request failed");
  const j = await r.json();

  const results = (j.local_results || []).slice(0, 10).map((p) => ({
    name: p.title,
    rating: p.rating,
    total_ratings: p.reviews,
    address: p.address,
    phone: p.phone,
    website: p.website,
    place_id: p.place_id,
  }));
  if (!results.length) return null; // let caller try Places fallback

  const lines = results.map((p, i) => {
    const rating =
      p.rating && p.total_ratings ? ` — ${p.rating}★ (${p.total_ratings})` : "";
    const site = p.website ? `  \n   ${p.website}` : "";
    const phone = p.phone ? `  \n   ${p.phone}` : "";
    const mapLink = p.place_id
      ? `  \n   https://www.google.com/maps/place/?q=place_id:${p.place_id}`
      : "";
    return `${i + 1}. **${p.name}**${rating}  \n   ${p.address ?? ""}${phone}${site}${mapLink}`;
  });

  return ["**Local results for:** " + query, "", ...lines].join("\n");
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

  const lines = results.map((p, i) => {
    const rating =
      p.rating && p.total_ratings ? ` — ${p.rating}★ (${p.total_ratings})` : "";
    const mapLink = `https://www.google.com/maps/place/?q=place_id:${p.place_id}`;
    return `${i + 1}. **${p.name}**${rating}  \n   ${p.address}  \n   ${mapLink}`;
  });

  return ["**Google Maps results for:** " + query, "", ...lines].join("\n");
}

// ───────────────────────── handler ─────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], role = "referrer" } = req.body || {};
    const last = messages[messages.length - 1];
    const userText = (last && last.content) || "";

    // Slash commands
    const slash = userText.trim().match(/^\/(search|news|maps|local)\s+(.+)/i);
    if (slash) {
      const [, cmd, query] = slash;
      if (cmd === "search") {
        return res.status(200).json({ reply: await doWebSearch(query) });
      }
      if (cmd === "news") {
        return res.status(200).json({ reply: await doNewsSearch(query) });
      }
      if (cmd === "maps") {
        return res.status(200).json({ reply: await doMapsSearch(query) });
      }
      if (cmd === "local") {
        const local = await doLocalSearch(query);
        if (local) return res.status(200).json({ reply: local });
        return res.status(200).json({ reply: await doMapsSearch(query) });
      }
    }

    // Auto local intent without slash
    if (isLocalIntent(userText)) {
      const local = await doLocalSearch(userText);
      if (local) return res.status(200).json({ reply: local });
      return res.status(200).json({ reply: await doMapsSearch(userText) });
    }

    // Normal chat -> OpenAI
    const sys = [
      systemPrompt,
      "",
      `User role: ${role}`,
      "When giving details about a specific business, only summarize what came from live search results (if any) and include short source links. If you didn’t search, say so.",
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
