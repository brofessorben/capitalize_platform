// pages/api/search-web.js
export default async function handler(req, res) {
  // Health check: GET /api/search-web -> { ok: true }
  if (req.method === "GET" && !req.query.q) {
    return res.status(200).json({ ok: true });
  }

  const SERPAPI_KEY = process.env.SERPAPI_KEY;
  if (!SERPAPI_KEY) {
    return res.status(500).json({ error: "Missing SERPAPI_KEY" });
  }

  let q, mode;
  if (req.method === "GET") {
    q = req.query.q;
    mode = req.query.mode || "web"; // "web" | "news"
  } else if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      q = body?.q;
      mode = body?.mode || "web";
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
    const base = "https://serpapi.com/search.json";
    const params = new URLSearchParams({
      q,
      api_key: SERPAPI_KEY,
      hl: "en",
      gl: "us",
    });

    // Pick engine
    if (mode === "news") {
      params.set("engine", "google_news");
    } else {
      params.set("engine", "google"); // default web search
      // You can add num=10 etc if you want more results.
    }

    const r = await fetch(`${base}?${params.toString()}`, { cache: "no-store" });
    if (!r.ok) throw new Error(`SerpAPI ${r.status}`);
    const data = await r.json();

    // Normalize results
    const items = [];
    if (mode === "news" && Array.isArray(data?.news_results)) {
      for (const n of data.news_results) {
        items.push({
          title: n.title,
          link: n.link,
          snippet: n.snippet || n.source || "",
          source: n.source || "",
          date: n.date || n.published_time || "",
        });
      }
    } else if (Array.isArray(data?.organic_results)) {
      for (const r of data.organic_results) {
        items.push({
          title: r.title,
          link: r.link,
          snippet: r.snippet || r.snippet_highlighted_words?.join(" ") || "",
          source: r.displayed_link || "",
        });
      }
    }

    return res.status(200).json({ query: q, mode, items });
  } catch (err) {
    console.error("search-web error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
}
