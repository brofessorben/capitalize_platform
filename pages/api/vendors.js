// pages/api/vendors.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query, location } = req.body; 
    // query = "bbq catering" or "wedding florist"
    // location = "Nashville, TN" or "37.7749,-122.4194"

    if (!query || !location) {
      return res.status(400).json({ error: "Missing query or location" });
    }

    const apiKey = process.env.GOOGLE_PLACES_KEY; // store your key in Vercel env

    // Build Google Places URL
    const url = `https://places.googleapis.com/v1/places:searchText?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: {
              latitude: parseFloat(location.split(",")[0]) || 0,
              longitude: parseFloat(location.split(",")[1]) || 0,
            },
            radius: 50000, // 50km
          },
        },
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Vendor search error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
