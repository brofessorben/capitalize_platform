// pages/api/chat.js
import OpenAI from "openai";
import { systemPrompt } from "../../lib/systemPrompt"; // named export; relative path from /pages/api

export const config = {
  api: { bodyParser: true },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------- utils ------------------------------------------------------

const stripPolite = (text = "") =>
  String(text)
    .replace(/^\s*(hey|hi|hello|please|can you|could you|would you)\b[:,\s]*/i, "")
    .trim();

const hostFromUrl = (url = "") => {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const oneLine = (s = "") =>
  String(s).replace(/\s+/g, " ").trim();

// ---------------- SerpAPI: web + news ---------------------------------------

async function doWebSearch(query) {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY missing");

  const u = new URL("https://serpapi.com/search.json");
  u.searchParams.set("engine", "google");
  u.searchParams.set("q", query);
  u.searchParams.set("num", "6");
  u.searchParams.set("hl", "en");
  u.searchParams.set("api_key", key);

  const r = await fetch(u, { next: { revalidate: 60 } });
  if (!r.ok) throw new Error("serpapi web request failed");
  const j = await r.json();

  const items = (j.organic_results || []).slice(0, 6).map((it) => ({
    title: it.title,
    url: it.link,
    site: hostFromUrl(it.link),
    snippet: it.snippet || "",
  }));

  if (!items.length) return "_No web results found._";

  const lines = items.map(
    (it, i) =>
      `${i + 1}. **${oneLine(it.title)}** — ${it.site}\n   ${oneLine(
        it.snippet
      )}\n   ${it.url}`
  );

  return [
    `**BBQ intel drop 🔥 — Web results for:** ${query}`,
    "",
    ...lines,
    "",
    "_Need me to turn this into a quick intro or outreach message?_",
  ].join("\n");
}

async function doNewsSearch(query) {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error("SERPAPI_KEY missing");

  const u = new URL("https://serpapi.com/search.json");
  u.searchParams.set("engine", "google_news");
  u.searchParams.set("q", query);
  u.searchParams.set("hl", "en");
  u.searchParams.set("gl", "us");
  u.searchParams.set("num", "6");
  u.searchParams.set("api_key", key);

  const r = await fetch(u, { next: { revalidate: 60 } });
  if (!r.ok) throw new Error("serpapi news request failed");
  const j = await r.json();

  const items = (j.news_results || []).slice(0, 6).map((it) => ({
    title: it.title,
    url: it.link,
    site: it.source || hostFromUrl(it.link),
    date: it.date || "",
    snippet: it.snippet || "",
  }));

  if (!items.length) return "_No recent articles found._";

  const lines = items.map(
    (it, i) =>
      `${i + 1}. **${oneLine(it.title)}** — ${it.site}${
        it.date ? ` (${it.date})` : ""
      }\n   ${oneLine(it.snippet)}\n   ${it.url}`
  );

  return [
    `**Fresh prints 🗞 — News for:** ${query}`,
    "",
    ...lines,
    "",
    "_Want me to draft a quick “saw-this-today” note?_",
  ].join("\n");
}

// ---------------- Google Places ---------------------------------------------

async function doMapsSearch(query) {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_KEY missing");

  const u = new URL(
    "https://maps.googleapis.com/maps/api/place/textsearch/json"
  );
  u.searchParams.set("query", query);
  u.searchParams.set("key", key);

  const r = await fetch(u, { next: { revalidate: 300 } });
  if (!r.ok) throw new Error("google places request failed");
  const j = await r.json();

  const items = (j.results || []).slice(0, 8).map((p) => {
    const link = `https://www.google.com/maps/place/?q=place_id:${p.place_id}`;
    const rating =
      p.rating && p.user_ratings_total
        ? ` — ${p.rating}★ (${p.user_ratings_total})`
        : "";
    return {
      name: p.name,
      address: p.formatted_address,
      link,
      rating,
    };
  });

  if (!items.length) return "_No places found._";

  const lines = items.map(
    (p, i) =>
      `${i + 1}. **${p.name}**${p.rating}\n   ${p.address}\n   ${p.link}`
  );

  return [
    `**Local radar 📍 — Google Maps results for:** ${query}`,
    "",
    ...lines,
    "",
    "_Want me to draft an intro or ask for availability/pricing?_",
  ].join("\n");
}

// ---------------- intent helpers --------------------------------------------

function guessIntent(text) {
  const t = text.toLowerCase();

  // explicit slash commands handled separately, this is for auto-detect
  if (/(menu|reviews?|hours|pricing|news)/.test(t)) return "web";
  if (/(find|near me|in |around ).*(truck|cater|vendor|venue|restaurant|bar|bbq|food)/.test(t))
    return "maps";
  return "chat";
}

// ---------------- API route --------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages = [], role = "referrer" } = req.body || {};
    const last = messages[messages.length - 1];
    const userText = stripPolite(last?.content || "");

    // 1) Slash commands: /search /news /maps
    const slash = userText.match(/^\/(search|news|maps)\s+(.+)/i);
    if (slash) {
      const [, cmd, q] = slash;
      if (cmd === "search") return res.status(200).json({ reply: await doWebSearch(q) });
      if (cmd === "news")   return res.status(200).json({ reply: await doNewsSearch(q) });
      return res.status(200).json({ reply: await doMapsSearch(q) });
    }

    // 2) Auto intent: if the phrasing obviously needs live info, do it for them
    const intent = guessIntent(userText);
    if (intent === "web")  return res.status(200).json({ reply: await doWebSearch(userText) });
    if (intent === "maps") return res.status(200).json({ reply: await doMapsSearch(userText) });

    // 3) Regular chat via OpenAI (fun, sales-forward)
    const sys = [
      systemPrompt,
      "",
      `User role: ${role}`,
      "Keep responses crisp, structured, and action-forward. Use light humor where it helps close deals.",
    ].join("\n");

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
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
      "Ready to draft the intro or proposal—shoot me the vendor + host details.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("api/chat error:", err);
    // user-friendly fallback
    return res.status(200).json({
      reply:
        "_Couldn’t reach the server. Try again in a moment. If this keeps happening, ping the team._",
    });
  }
}
