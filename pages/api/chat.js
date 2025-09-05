// pages/api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, role } = req.body || {};
    const lastMsg = messages?.[messages.length - 1]?.content || "";
    const text = lastMsg.trim();

    // Detect commands
    if (text.startsWith("/search") || text.startsWith("/news")) {
      const q = text.replace(/^\/(search|news)/, "").trim();
      const mode = text.startsWith("/news") ? "news" : "web";

      const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/search-web`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, mode }),
      });
      const data = await r.json();

      return res.status(200).json({
        reply: formatSearchResults(data.items),
      });
    }

    if (text.startsWith("/maps")) {
      const q = text.replace("/maps", "").trim();

      const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/maps-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, region: "us" }),
      });
      const data = await r.json();

      return res.status(200).json({
        reply: formatMapResults(data.items),
      });
    }

    // Default: forward to OpenAI
    const reply = await callOpenAI(messages, role);
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("chat error:", err);
    return res.status(500).json({ error: "Chat failed" });
  }
}

// Helpers
function formatSearchResults(items = []) {
  if (!items.length) return "No results found.";
  return (
    "### Search Results\n" +
    items
      .slice(0, 5)
      .map((x, i) => `**${i + 1}. ${x.title}**\n${x.snippet}\n${x.link}`)
      .join("\n\n")
  );
}

function formatMapResults(items = []) {
  if (!items.length) return "No places found.";
  return (
    "### Places\n" +
    items
      .slice(0, 5)
      .map(
        (x, i) =>
          `**${i + 1}. ${x.name}**\n${x.address}\n⭐ ${x.rating || "?"} (${x.reviews || 0} reviews)\n[View Map](${x.maps_url})`
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
    }),
  });

  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const data = await r.json();
  return data.choices?.[0]?.message?.content || "No reply.";
}
