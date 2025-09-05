// pages/api/chat.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** ---- Helper: Web search (Google CSE) ---- */
async function searchWeb(q, num = 5) {
  const cx = process.env.GOOGLE_CSE_ID;
  const key = process.env.GOOGLE_CSE_KEY;
  if (!cx || !key) throw new Error("CSE not configured");
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("q", q);
  url.searchParams.set("cx", cx);
  url.searchParams.set("key", key);
  url.searchParams.set("num", String(num));
  url.searchParams.set("safe", "active");

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`CSE HTTP ${r.status}`);
  const data = await r.json();
  return (data.items || []).map((it) => ({
    title: it.title,
    link: it.link,
    snippet: it.snippet,
    site: it.displayLink,
  }));
}

/** ---- Helper: Places search (Google Places) ---- */
async function searchPlaces(q, limit = 5, region = "us") {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("MAPS not configured");

  const textUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  textUrl.searchParams.set("query", q);
  textUrl.searchParams.set("region", region);
  textUrl.searchParams.set("key", key);

  const tr = await fetch(textUrl.toString());
  if (!tr.ok) throw new Error(`Places TextSearch HTTP ${tr.status}`);
  const tdata = await tr.json();
  const picks = (tdata.results || []).slice(0, Number(limit));

  const details = await Promise.all(
    picks.map(async (p) => {
      const dUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      dUrl.searchParams.set("place_id", p.place_id);
      dUrl.searchParams.set(
        "fields",
        "name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,geometry/location"
      );
      dUrl.searchParams.set("key", key);

      const dr = await fetch(dUrl.toString());
      const ddata = await dr.json();
      const d = ddata.result || {};
      return {
        name: d.name || p.name,
        address: d.formatted_address || p.formatted_address,
        phone: d.formatted_phone_number || null,
        website: d.website || null,
        rating: d.rating ?? null,
        reviews: d.user_ratings_total ?? null,
        priceLevel: d.price_level ?? null,
        lat: d?.geometry?.location?.lat ?? p?.geometry?.location?.lat ?? null,
        lng: d?.geometry?.location?.lng ?? p?.geometry?.location?.lng ?? null,
        googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
      };
    })
  );

  return details;
}

/** ---- Tools schema the model can call ---- */
const tools = [
  {
    type: "function",
    function: {
      name: "searchWeb",
      description: "General web search for facts, news, docs, vendors’ websites.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "The search query" },
          num: { type: "number", description: "Number of results (max 10)" }
        },
        required: ["q"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchPlaces",
      description: "Google Places vendor search (e.g., caterers near X).",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search like 'wedding florist in Austin'" },
          limit: { type: "number", description: "How many vendors to return (max 10)" },
          region: { type: "string", description: "ISO region bias, e.g., 'us'" }
        },
        required: ["q"]
      }
    }
  }
];

/** ---- System prompt to keep answers clean + only search when needed ---- */
const SYS = `You are Capitalize's wedding/workflow copilot.
- Format with clean Markdown: headings, bullets, numbered steps, line breaks.
- Use concise answers.
- If the user asks for real-world info (vendors, addresses, phone, current facts) or it would help, call a tool.
- When using web results, summarize and include short inline links.
- When using places, list 3–5 options with name, rating, phone/website, and a Google Maps link.
- If no search is needed, just answer normally.
`;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

    const { messages = [] } = await req.json?.() || req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages[] required" });

    // Compose message list with our system prompt at the top
    const convo = [{ role: "system", content: SYS }, ...messages];

    // Up to 2 tool-use turns to keep latency sane
    let toolIterations = 0;
    let response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: convo,
      tools,
      tool_choice: "auto",
      temperature: 0.3,
    });

    while (response.choices?.[0]?.message?.tool_calls?.length && toolIterations < 2) {
      toolIterations++;
      const toolCalls = response.choices[0].message.tool_calls;

      // Push assistant "tool call" msg
      convo.push(response.choices[0].message);

      for (const call of toolCalls) {
        const { name, arguments: argsJson, id } = call.function;
        const args = JSON.parse(argsJson || "{}");

        let toolResult;
        if (name === "searchWeb") {
          toolResult = await searchWeb(args.q, Math.min(args.num || 5, 10));
        } else if (name === "searchPlaces") {
          toolResult = await searchPlaces(args.q, Math.min(args.limit || 5, 10), args.region || "us");
        } else {
          toolResult = { error: `Unknown tool: ${name}` };
        }

        // Feed result back as a tool message
        convo.push({
          role: "tool",
          tool_call_id: id,
          name,
          content: JSON.stringify(toolResult),
        });
      }

      // Ask the model to finish with the gathered data
      response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: convo,
        temperature: 0.3,
      });
    }

    const final = response.choices?.[0]?.message?.content ?? "Sorry, I couldn’t generate a response.";
    res.status(200).json({ content: final });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
