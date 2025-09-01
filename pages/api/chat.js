// pages/api/chat.js
// Minimal, stable handler: tries Google Places (New) first; falls back to OpenAI.
// No fancy imports; uses built-in fetch supported by Next.js API routes.

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

// very small city center map for bias; expand later
const CITY_CENTER = {
  nashville: { lat: 36.1627, lng: -86.7816, radiusMeters: 45000 },
  austin: { lat: 30.2672, lng: -97.7431, radiusMeters: 45000 },
  atlanta: { lat: 33.749, lng: -84.388, radiusMeters: 45000 },
  miami: { lat: 25.7617, lng: -80.1918, radiusMeters: 45000 },
  chicago: { lat: 41.8781, lng: -87.6298, radiusMeters: 50000 },
};

function parseSearch(text) {
  if (!text) return null;
  const lowered = String(text).toLowerCase().trim();

  // patterns: "find bbq caterer in nashville", "find taco trucks near austin", "find wedding florist"
  const p1 = lowered.match(/^\s*find\s+(.+?)\s+(?:in|near)\s+([a-z\s]+)\s*$/i);
  const p2 = lowered.match(/^\s*find\s+(.+?)\s*$/i);

  if (p1) {
    return {
      query: p1[1].trim(),
      city: p1[2].replace(/[^a-z\s]/g, "").trim(),
    };
  }
  if (p2) {
    return { query: p2[1].trim(), city: "" };
  }
  return null;
}

async function placesSearchText({ query, city }) {
  if (!MAPS_KEY) throw new Error("GOOGLE_MAPS_API_KEY not set");

  // pick bias center
  let bias = CITY_CENTER.nashville;
  if (city && CITY_CENTER[city.toLowerCase()]) bias = CITY_CENTER[city.toLowerCase()];

  const payload = {
    textQuery: query + (city ? ` in ${city}` : ""),
    languageCode: "en",
    maxResultCount: 8,
    locationBias: {
      circle: {
        center: { latitude: bias.lat, longitude: bias.lng },
        radius: bias.radiusMeters || 45000,
      },
    },
  };

  const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": MAPS_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.primaryType,places.rating,places.userRatingCount,places.websiteUri,places.internationalPhoneNumber",
    },
    body: JSON.stringify(payload),
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Places API error", data);
    throw new Error("Places API error");
  }

  const items = (data.places || []).map((p) => ({
    id: p.id,
    name: p.displayName?.text || "Unknown",
    address: p.formattedAddress || "",
    type: p.primaryType || "",
    rating: p.rating || null,
    reviews: p.userRatingCount || null,
    phone: p.internationalPhoneNumber || "",
    website: p.websiteUri || "",
  }));

  return items;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const text = String(body.text || "").trim();

    // 1) Try vendor search
    const parsed = parseSearch(text);
    if (parsed?.query) {
      try {
        const vendors = await placesSearchText(parsed);
        if (vendors.length > 0) {
          const lines = vendors.map((v, i) => {
            const bits = [
              `**${i + 1}. ${v.name}**`,
              v.address && `• ${v.address}`,
              v.phone && `• ${v.phone}`,
              v.website && `• ${v.website}`,
              v.rating && `• ⭐ ${v.rating} (${v.reviews || 0})`,
            ].filter(Boolean);
            return bits.join("  \n");
          });

          return res.status(200).json({
            reply:
              `Here are options for **${parsed.query}**${
                parsed.city ? ` in **${parsed.city}**` : ""
              }:\n\n${lines.join("\n\n")}\n\nReply with a number to use it.`,
          });
        }

        return res
          .status(200)
          .json({ reply: `I tried **${parsed.query}**${parsed.city ? ` in ${parsed.city}` : ""} but didn’t find solid matches. Try a nearby city or broader term?` });
      } catch (e) {
        console.error("Places search failed, falling back to chat:", e);
        // fallthrough to chat
      }
    }

    // 2) General chat fallback
    if (!OPENAI_API_KEY) {
      return res.status(200).json({
        reply:
          "Ask me to “Find a {category} in {city}” (e.g., “Find a BBQ caterer in Nashville”), or paste vendor + host contact and I’ll draft the intro.",
      });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 320,
        messages: [
          {
            role: "system",
            content:
              "You are CAP’s friendly ops AI. Be concise, proactive, and help users capture leads. If they want vendors, tell them they can say: 'Find {category} in {city}'.",
          },
          { role: "user", content: text },
        ],
      }),
    });

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content || "👍";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("chat error:", err);
    return res.status(500).json({ error: "Chat error", details: String(err?.message || err) });
  }
}
