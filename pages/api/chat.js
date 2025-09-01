// pages/api/chat.js
import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

// crude city lat/lng map for quick bias; add more as needed
const CITY_CENTER = {
  nashville: { lat: 36.1627, lng: -86.7816, radiusMeters: 45000 },
  austin: { lat: 30.2672, lng: -97.7431, radiusMeters: 45000 },
  atlanta: { lat: 33.749, lng: -84.388, radiusMeters: 45000 },
  miami: { lat: 25.7617, lng: -80.1918, radiusMeters: 45000 },
  chicago: { lat: 41.8781, lng: -87.6298, radiusMeters: 50000 },
};

function parseSearch(text) {
  // “find a bbq caterer in nashville”, “find taco trucks near austin”, etc.
  const lowered = text.toLowerCase();
  const m = lowered.match(/find (.+?)(?: in | near )([a-z\s]+)$/i) || lowered.match(/find (.+)$/i);
  if (!m) return null;

  const query = (m[1] || "").trim();
  let city = (m[2] || "").trim();
  city = city.replace(/[^a-z\s]/g, "").trim();

  return { query, city };
}

async function placesSearchText({ query, city }) {
  if (!MAPS_KEY) throw new Error("GOOGLE_MAPS_API_KEY not set");

  // resolve bias
  let bias = CITY_CENTER["nashville"]; // default
  if (city) {
    const key = city.toLowerCase();
    if (CITY_CENTER[key]) bias = CITY_CENTER[key];
  }

  const payload = {
    textQuery: query + (city ? ` in ${city}` : ""),
    // prefer business type results
    includedType: "restaurant",
    languageCode: "en",
    maxResultCount: 8,
    locationBias: {
      circle: {
        center: { latitude: bias.lat, longitude: bias.lng },
        radius: bias.radiusMeters || 45000,
      },
    },
  };

  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": MAPS_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.primaryType,places.rating,places.userRatingCount,places.websiteUri,places.internationalPhoneNumber",
    },
    body: JSON.stringify(payload),
  });

  const data = await r.json();
  if (!r.ok) {
    console.error("Places error:", data);
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
    const { text = "", sender = "referrer", lead_id } = req.body || {};

    // 1) If it looks like a vendor search, hit Places first
    const parsed = parseSearch(text);
    if (parsed?.query) {
      try {
        const vendors = await placesSearchText(parsed);
        if (vendors.length > 0) {
          // nice, return a formatted list the UI can show as a message
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
              `Here are some options for **${parsed.query}**${
                parsed.city ? ` in **${parsed.city}**` : ""
              }:\n\n` +
              lines.join("\n\n") +
              `\n\nReply with a number and I’ll drop it into the lead form.`,
          });
        } else {
          return res
            .status(200)
            .json({ reply: `I looked for **${parsed.query}**${parsed.city ? ` near ${parsed.city}` : ""} but didn’t find solid matches. Try a nearby city or broader term?` });
        }
      } catch (e) {
        console.error(e);
        // fall through to chat below
      }
    }

    // 2) Otherwise, use OpenAI for general chat
    if (!OPENAI_API_KEY) {
      return res.status(200).json({
        reply:
          "Ask me to “Find a {category} in {city}” (e.g., “Find a BBQ caterer in Nashville”) or tell me who to introduce and I’ll draft the intro. (Set OPENAI_API_KEY for richer replies.)",
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
        messages: [
          {
            role: "system",
            content:
              "You are CAP’s friendly ops AI. Be concise, proactive, and help users capture leads and keep momentum. If they ask about vendors, instruct them they can say: 'Find {category} in {city}'.",
          },
          { role: "user", content: text },
        ],
        max_tokens: 320,
      }),
    });

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content || "👍";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("chat error", err);
    return res.status(500).json({ error: "Chat error", details: String(err?.message || err) });
  }
}
