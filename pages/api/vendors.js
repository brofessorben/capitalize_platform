// pages/api/vendors.js
// Vendor search proxy: works with mock data by default.
// If GOOGLE_MAPS_API_KEY is set, uses Google Places API Text Search + Details for phone/website.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const q = String(req.query.query || "").trim();
  if (!q) {
    return res.status(400).json({ error: "Missing query. Example: /api/vendors?query=taco catering in Austin" });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;

  try {
    if (!key) {
      // Safe mock so builds always work
      return res.status(200).json({
        results: [
          {
            name: "Estrella Taco Catering",
            rating: 4.7,
            address: "123 Congress Ave, Austin, TX",
            phone: "(512) 555-0123",
            website: "https://example-tacos.com",
          },
          {
            name: "Comet Kitchen Co.",
            rating: 4.6,
            address: "45 Zilker Rd, Austin, TX",
            phone: "(512) 555-0456",
            website: "https://cometkitchen.example",
          },
          {
            name: "Milky Way Events & Catering",
            rating: 4.8,
            address: "900 Galaxy Blvd, Austin, TX",
            phone: "(512) 555-0987",
            website: "https://milkyway.events",
          },
        ],
        source: "mock",
      });
    }

    // Real lookup via Google Places Text Search
    const ts = await fetch(
      "https://maps.googleapis.com/maps/api/place/textsearch/json?" +
        new URLSearchParams({ query: q, key })
    );
    const tsData = await ts.json();

    if (!ts.ok || tsData.status === "REQUEST_DENIED") {
      throw new Error(tsData.error_message || "Google Places error");
    }

    // Enrich with details (phone, website) for first few
    const results = [];
    for (const p of (tsData.results || []).slice(0, 8)) {
      let phone = null;
      let website = null;
      try {
        const det = await fetch(
          "https://maps.googleapis.com/maps/api/place/details/json?" +
            new URLSearchParams({
              place_id: p.place_id,
              fields: "formatted_phone_number,website",
              key,
            })
        );
        const detData = await det.json();
        if (detData?.result) {
          phone = detData.result.formatted_phone_number || null;
          website = detData.result.website || null;
        }
      } catch {
        // swallow detail errors
      }

      results.push({
        name: p.name,
        rating: p.rating || null,
        address: p.formatted_address || null,
        phone,
        website,
        place_id: p.place_id,
      });
    }

    // Mild caching
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=300");
    return res.status(200).json({ results, source: "google" });
  } catch (err) {
    return res.status(500).json({ error: "Vendor search failed", details: String(err?.message || err) });
  }
}
