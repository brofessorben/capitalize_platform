// pages/api/maps-search.js
export default async function handler(req, res) {
  // Health check: GET /api/maps-search -> { ok: true }
  if (req.method === "GET" && !req.query.q) {
    return res.status(200).json({ ok: true });
  }

  const MAPS_KEY = process.env.GOOGLE_PLACES_KEY; // matches your Vercel var name
  if (!MAPS_KEY) {
    return res.status(500).json({ error: "Missing GOOGLE_PLACES_KEY" });
  }

  let q, region, location, radius;
  if (req.method === "GET") {
    q = req.query.q;
    region = req.query.region;     // e.g., "us"
    location = req.query.location; // "lat,lng"
    radius = req.query.radius;     // meters
  } else if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      q = body?.q;
      region = body?.region;
      location = body?.location;
      radius = body?.radius;
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!q || !q.trim()) {
    return res.status(400).json({ error: "Missing query (q)" });
  }

  try {
    const params = new URLSearchParams({
      query: q,
      key: MAPS_KEY,
    });
    if (region) params.set("region", region);
    if (location) params.set("location", location);
    if (radius) params.set("radius", radius);

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Places ${r.status}`);
    const data = await r.json();

    const items = (data.results || []).map((p) => ({
      name: p.name,
      address: p.formatted_address,
      rating: p.rating,
      reviews: p.user_ratings_total,
      place_id: p.place_id,
      // Quick link users can click
      maps_url: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
      // basic price level if present: 0–4
      price_level: p.price_level,
      types: p.types,
    }));

    return res.status(200).json({ query: q, items });
  } catch (err) {
    console.error("maps-search error:", err);
    return res.status(500).json({ error: "Maps search failed" });
  }
}
