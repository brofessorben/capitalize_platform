// pages/api/chat.js
/**
 * Smart chat endpoint:
 * - Detects vendor-search intent like "find/suggest/recommend ... in CITY"
 * - If detected, calls Google Places (via your env key) and returns a curated list
 * - Otherwise, falls back to regular OpenAI chat
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text = "", sender = "user", lead_id = "general" } = req.body || {};
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text" });
    }

    // 1) Try to detect vendor-search intent
    const intent = detectVendorIntent(text);
    if (intent) {
      const places = await searchVendors(intent.query, intent.location);
      if (places?.length) {
        const top = places.slice(0, 5);
        const lines = top.map((v, i) => {
          const rating =
            v.rating ? ` — ⭐ ${v.rating}${v.reviews ? ` (${v.reviews})` : ""}` : "";
          const phone = v.phone ? ` • ${v.phone}` : "";
          const web = v.website ? ` • ${v.website}` : "";
          return `${i + 1}. ${v.name}${rating}\n   ${v.address}${phone}${web}`;
        });

        const reply =
          `Here are some solid ${intent.query}${intent.location ? ` near ${intent.location}` : ""} I found:\n\n` +
          lines.join("\n") +
          `\n\nWant me to draft an intro message to the top picks or save any to your lead?`;

        return res.status(200).json({ reply, mode: "vendors" });
      }

      return res
        .status(200)
        .json({
          reply: `I looked for **${intent.query}**${intent.location ? ` near ${intent.location}` : ""} but didn’t find good matches. Try a different category or nearby city?`,
          mode: "vendors",
        });
    }

    // 2) Fall back to OpenAI for general chat
    if (!openaiKey) {
      // graceful fallback if no key
      return res.status(200).json({
        reply:
          "AI chat is almost ready. Add OPENAI_API_KEY in your Vercel env to enable full answers.",
        mode: "plain",
      });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are the CAPITALIZE concierge. Be concise, fun, and helpful. If the user is a referrer, guide them to share host + vendor contact details and the need. If a host, help them specify date, headcount, budget, constraints. If a vendor, help them respond with quick proposals. Keep momentum, avoid long walls of text.",
      },
      { role: "user", content: text },
    ];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("OpenAI error:", data);
      return res.status(502).json({ error: "OpenAI error", details: data });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || "👍";
    return res.status(200).json({ reply, mode: "openai" });
  } catch (err) {
    console.error("chat error", err);
    return res.status(500).json({ error: "Chat error", details: String(err?.message || err) });
  }
}

// --- helpers ---

function detectVendorIntent(text) {
  const t = text.toLowerCase();

  // trigger words
  const wants = /(find|recommend|suggest|look\s*up|search|nearby|good|best)/.test(t);
  const vendorish =
    /(vendor|cater|chef|food truck|bbq|barbecue|bartend|bar service|dj|band|music|photograph|photo|video|venue|space|hall|florist|flowers|planner|rentals|chairs|tables|av|a\/v|lighting|security|clean|staff|waitstaff|cook)/.test(
      t
    );

  if (!wants && !vendorish) return null;

  // try to pull location after “in …” or “near …”
  const locMatch = text.match(/\b(?:in|near|around)\s+([^.,;!?]+)/i);
  const location = locMatch ? locMatch[1].trim() : undefined;

  // rough category: remove the location tail
  const stripped = location ? text.replace(locMatch[0], "").trim() : text.trim();
  const query = stripped
    .replace(/^(find|recommend|suggest|search|look\s*up)\b/i, "")
    .replace(/\b(near|around|in)\b.*$/i, "")
    .trim() || "event vendor";

  return { query, location };
}

async function searchVendors(query, location) {
  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) return [];

  // Same strategy as /api/vendors, but inline to avoid extra hop
  const body = { textQuery: query + (location ? ` in ${location}` : "") };

  const url = `https://places.googleapis.com/v1/places:searchText?key=${apiKey}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount",
    },
    body: JSON.stringify(body),
  });

  const data = await r.json();
  if (!r.ok) {
    console.error("Places error:", data);
    return [];
  }

  return (data.places || []).map((p) => ({
    name: p.displayName?.text || "",
    address: p.formattedAddress || "",
    phone: p.internationalPhoneNumber || "",
    website: p.websiteUri || "",
    rating: p.rating || null,
    reviews: p.userRatingCount || null,
  }));
}
