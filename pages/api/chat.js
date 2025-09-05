// pages/api/chat.js
/* eslint-disable no-console */

import systemPrompt from "../../lib/systemPrompt";

// Build a reliable absolute origin on Vercel (works locally, too)
function getOrigin(req) {
  // Prefer Vercel's injected URL (e.g. my-app.vercel.app)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Fallback to the host header (local dev)
  const host = req?.headers?.host || "localhost:3000";
  const proto = (req?.headers?.["x-forwarded-proto"] || "").includes("https")
    ? "https"
    : "http";
  return `${proto}://${host}`;
}

// POST helper with sane defaults
async function postJSON(url, payload) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000); // 20s safety timeout
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function formatSearchResults(json, sourceLabel = "web") {
  const items = Array.isArray(json?.results) ? json.results : [];
  if (!items.length) {
    return "_No results found. Try a more specific query._";
  }
  // Markdown list with title → link + snippet
  const lines = items.slice(0, 8).map((r, i) => {
    const title = r.title || r.name || r.url || "Result";
    const url = r.url || r.link || r.website || "";
    const snippet = r.snippet || r.description || r.formatted_address || r.vicinity || "";
    return `**${i + 1}. [${title}](${url})**\n${snippet ? `${snippet}\n` : ""}`;
  });
  return [
    `### Top ${sourceLabel} results`,
    "",
    ...lines,
    "",
    "_Tip: ask me to summarize or compare any of these._",
  ].join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages = [], role = "referrer" } = req.body || {};
    const last = messages[messages.length - 1];
    const userText = (last?.content || "").trim();

    const origin = getOrigin(req);

    // ---------------------------
    // Slash commands
    // ---------------------------
    // /search query → web search via /api/search-web
    // /news query   → news search via /api/search-web?type=news
    // /maps query   → Google Places via /api/maps-search
    const slash = userText.startsWith("/")
      ? userText.slice(1).split(/\s+/, 1)[0].toLowerCase()
      : null;

    if (slash === "search" || slash === "news") {
      const query = userText.replace(/^\/(search|news)\s*/i, "").trim();
      if (!query) {
        return res.json({
          content:
            "Give me something to look up. Example:\n\n`/search best taco trucks in Nashville`",
        });
      }

      const payload = { q: query, type: slash === "news" ? "news" : "search" };
      const json = await postJSON(`${origin}/api/search-web`, payload);
      const md = formatSearchResults(json, slash === "news" ? "news" : "web");
      return res.json({ content: md });
    }

    if (slash === "maps") {
      const query = userText.replace(/^\/maps\s*/i, "").trim();
      if (!query) {
        return res.json({
          content:
            "Tell me what to find. Example:\n\n`/maps bbq caterers in Nashville`",
        });
      }
      const json = await postJSON(`${origin}/api/maps-search`, { q: query });
      const md = formatSearchResults(json, "Google Maps");
      return res.json({ content: md });
    }

    // ---------------------------
    // Normal AI reply (OpenAI)
    // ---------------------------
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY",
        content:
          "Server is missing `OPENAI_API_KEY`. Ask the admin to set it in Vercel.",
      });
    }

    // Build the conversation for OpenAI
    // Seed with a focused system prompt that knows about roles
    const sys = [
      systemPrompt || "",
      "",
      "You are CAPITALIZE's co-pilot. Keep answers concise, formatted in clean Markdown with headings and bullets when helpful.",
      `Current console role: ${role}.`,
      "If the user asks you to search, suggest `/search`, `/news`, or `/maps` commands (but only if they haven't used one already).",
    ]
      .filter(Boolean)
      .join("\n");

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: sys },
          ...messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : m.role,
            content: String(m.content || ""),
          })),
        ],
      }),
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text().catch(() => "");
      throw new Error(`OpenAI error: ${openaiRes.status} ${openaiRes.statusText} — ${text}`);
    }

    const data = await openaiRes.json();
    const content =
      data?.choices?.[0]?.message?.content ||
      "Got it — give me more details and I’ll draft the next step.";

    return res.json({ content });
  } catch (err) {
    console.error("chat api error:", err);
    return res.status(200).json({
      content:
        "_Couldn’t reach the server. Try again in a moment._\n\nIf this keeps happening, ping the team.",
    });
  }
}
