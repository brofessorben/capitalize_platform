// pages/api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const { messages = [], role } = req.body || {};
    const last = messages[messages.length - 1] || {};
    const text = (last.content || "").trim();

    // Build absolute origin so server-to-server fetches work on Vercel
    const proto = (req.headers["x-forwarded-proto"] || "https");
    const host = req.headers.host;
    const origin = `${proto}://${host}`;

    // 1) Explicit commands
    if (text.startsWith("/search") || text.startsWith("/news")) {
      const q = text.replace(/^\/(search|news)/, "").trim();
      const mode = text.startsWith("/news") ? "news" : "web";
      const data = await callInternal(`${origin}/api/search-web`, { q, mode });
      return res.status(200).json({ reply: formatWeb(data?.items) });
    }

    if (text.startsWith("/maps")) {
      const q = text.replace(/^\/maps/, "").trim();
      const data = await callInternal(`${origin}/api/maps-search`, { q, region: "us" });
      return res.status(200).json({ reply: formatMaps(data?.items) });
    }

    // 2) Heuristic auto-search for web-y questions
    if (looksLikeWebQuestion(text)) {
      const data = await callInternal(`${origin}/api/search-web`, { q: text, mode: "web" });
      const reply = formatWeb(data?.items);
      if (reply && reply !== "No results found.") {
        return res.status(200).json({ reply });
      }
    }

    // 3) Fallback: OpenAI answer (no browsing)
    const reply = await callOpenAI(messages, role);
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("chat error:", err);
    return res.status(500).json({ error: "Chat failed" });
  }
}

/* ---------- helpers ---------- */

async function callInternal(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!r.ok) throw new Error(`Internal fetch ${url} -> ${r.status}`);
  return r.json();
}

function looksLikeWebQuestion(t) {
  const s = t.toLowerCase();
  // Simple triggers — tune freely
  return (
    /^what|^who|^where|^when|^why|^how/.test(s) ||
    /latest|news|today|yesterday/.test(s) ||
    /hours|menu|location|address|phone|review|ratings?/.test(s) ||
    /nashville|denver|austin|seattle|chicago|nyc|los angeles|houston/.test(s) ||
    /food truck|cater(er|ing)|restaurant|barbecue|bbq|grille|grill/.test(s)
  );
}

function formatWeb(items = []) {
  if (!items.length) return "No results found.";
  // show up to 5 with titles, snippets, links
  return (
    "### Sources\n" +
    items
      .slice(0, 5)
      .map(
        (x, i) =>
          `**${i + 1}. ${x.title || "Untitled"}**\n${x.snippet || ""}\n${x.link || ""}`
      )
      .join("\n\n")
  );
}

function formatMaps(items = []) {
  if (!items.length) return "No places found.";
  return (
    "### Places\n" +
    items
      .slice(0, 5)
      .map(
        (x, i) =>
          `**${i + 1}. ${x.name}**\n${x.address || ""}\n⭐ ${x.rating ?? "?"} (${x.reviews ?? 0} reviews)\n${x.phone ? `☎ ${x.phone}\n` : ""}${x.maps_url ? `[View Map](${x.maps_url})` : ""}`
      )
      .join("\n\n")
  );
}

async function callOpenAI(messages, role) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: messages.map((m) => ({
        role: m.role === "ai" ? "assistant" : m.role,
        content: m.content,
      })),
      temperature: 0.3,
    }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const data = await r.json();
  return data.choices?.[0]?.message?.content || "No reply.";
}
