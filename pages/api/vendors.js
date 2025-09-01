// pages/api/vendors.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query, location } = req.body; // query: "bbq catering", location: "Nashville, TN" or "36.16,-86.78"
    if (!query) return res.status(400).json({ error: "Missing query" });

    const apiKey = process.env.GOOGLE_PLACES_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GOOGLE_PLACES_KEY env" });

    // Detect "lat,lng"
    const latLng =
      typeof location === "string" && /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(location)
        ? location.split(",").map((n) => parseFloat(n.trim()))
        : null;

    // Build request body for Places API (New)
    const body = {
      textQuery: query + (location && !latLng ? ` in ${location}` : ""),
    };

    // If lat/lng provided, add a 50km location bias
    if (latLng) {
      body.locationBias = {
        circle: {
          center: { latitude: latLng[0], longitude: latLng[1] },
          radius: 50000,
        },
      };
    }

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
      return res.status(502).json({ error: "Places error", details: data });
    }

    // Normalize a compact list
    const items =
      (data.places || []).map((p) => ({
        name: p.displayName?.text || "",
        address: p.formattedAddress || "",
        phone: p.internationalPhoneNumber || "",
        website: p.websiteUri || "",
        rating: p.rating || null,
        reviews: p.userRatingCount || null,
      })) || [];

    res.status(200).json({ items });
  } catch (err) {
    console.error("vendors error", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
