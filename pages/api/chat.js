// pages/api/chat.js
import OpenAI from "openai";
import { systemPrompt } from "../../lib/systemPrompt";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: true } };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function supa() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}

/* ---------- web helpers: /search, /news, /maps ---------- */
async function doWebSearch(query) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return "_Web search unavailable (missing key)._";
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", "5");
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", key);
  const r = await fetch(url);
  if (!r.ok) return "_Search failed._";
  const j = await r.json();
  const results = (j.organic_results || []).slice(0, 5);
  if (!results.length) return "_No results found._";
  return [
    "BBQ intel drop 🔥 — **Web results for:** " + query,
    ...results.map(
      (r, i) => `${i + 1}. [${r.title}](${r.link})\n${r.snippet ?? ""}`
    ),
  ].join("\n");
}

async function doNewsSearch(query) {
  const key = process.env.SERPAPI_KEY;
  if (!key) return "_News search unavailable (missing key)._";
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_news");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "us");
  url.searchParams.set("num", "5");
  url.searchParams.set("api_key", key);
  const r = await fetch(url);
  if (!r.ok) return "_News search failed._";
  const j = await r.json();
  const results = (j.news_results || []).slice(0, 5);
  if (!results.length) return "_No articles found._";
  return [
    "Hot tape 📣 — **News for:** " + query,
    ...results.map(
      (r, i) =>
        `${i + 1}. [${r.title}](${r.link}) — ${r.source}${
          r.date ? ` (${r.date})` : ""
        }\n${r.snippet ?? ""}`
    ),
  ].join("\n");
}

async function doMapsSearch(query) {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return "_Maps search unavailable (missing key)._";
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/textsearch/json"
  );
  url.searchParams.set("query", query);
  url.searchParams.set("key", key);
  const r = await fetch(url);
  if (!r.ok) return "_Maps search failed._";
  const j = await r.json();
  const results = (j.results || []).slice(0, 8);
  if (!results.length) return "_No places found._";
  const lines = results.map((p, i) => {
    const link = `https://www.google.com/maps/place/?q=place_id:${p.place_id}`;
    const rating =
      p.rating && p.user_ratings_total
        ? ` — ${p.rating}★ (${p.user_ratings_total})`
        : "";
    return `${i + 1}. **${p.name}**${rating}\n${p.formatted_address}\n${link}`;
  });
  return ["Map scout 🗺️ — **Results for:** " + query, ...lines].join("\n");
}

/* ------------------------- main handler ------------------------- */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "nope" });

  try {
    const { messages = [], role = "referrer", eventId } = req.body || {};
    const last = messages[messages.length - 1] || { content: "" };
    const userText = String(last.content || "").trim();

    // Slash commands first
    const slash = userText.match(/^\/(search|news|maps)\s+(.+)/i);
    if (slash) {
      const [, cmd, q] = slash;
      const md =
        cmd === "search"
          ? await doWebSearch(q)
          : cmd === "news"
          ? await doNewsSearch(q)
          : await doMapsSearch(q);

      // store the assistant message (command output) if we have an event
      if (eventId) {
        await supa().from("messages").insert({
          event_id: eventId,
          role: "assistant",
          content: md,
        });
      }
      return res.status(200).json({ reply: md });
    }

    // System prompt
    const sys = [
      systemPrompt,
      `User role: ${role}`,
      "If user asks for live info, prefer the /search, /news, /maps helpers.",
    ].join("\n");

    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
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
      "I’m here—drop the details and I’ll spin it up.";

    // persist last user + assistant to supabase if an event thread was provided
    if (eventId) {
      const batch = [];
      if (last?.content) {
        batch.push({
          event_id: eventId,
          role,
          content: last.content,
        });
      }
      batch.push({ event_id: eventId, role: "assistant", content: reply });
      await supa().from("messages").insert(batch);
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("api/chat error:", err);
    return res.status(200).json({
      reply:
        "_Couldn’t reach the server. Try again in a moment. If this keeps happening, ping the team._",
    });
  }
}
