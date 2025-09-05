// pages/api/maps-search.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { query } = req.body || {};
    if (!query || !query.trim()) return res.status(400).json({ error: "Missing query" });

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing GOOGLE_MAPS_API_KEY" });

    const params = new URLSearchParams({
      query,
      key,
    });

    // Google Places Text Search
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
      const t = await resp.text();
      return res.status(502).json({ error: "Upstream error", detail: t.slice(0, 500) });
    }
    const data = await resp.json();

    const results = (data.results || []).slice(0, 8).map(p => ({
      name: p.name,
      address: p.formatted_address,
      rating: p.rating,
      total_ratings: p.user_ratings_total,
      place_id: p.place_id,
      maps_url: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
    }));

    res.status(200).json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unknown error" });
  }
}
