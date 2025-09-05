// pages/api/search-web.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { query, mode = "web", num = 5 } = req.body || {};
    if (!query || !query.trim()) return res.status(400).json({ error: "Missing query" });

    const apiKey = process.env.SERP_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing SERP_API_KEY" });

    const params = new URLSearchParams({
      api_key: apiKey,
      num: String(num),
    });

    if (mode === "news") {
      params.set("engine", "google_news");
      params.set("q", query);
    } else {
      params.set("engine", "google");
      params.set("q", query);
    }

    const url = `https://serpapi.com/search.json?${params.toString()}`;
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
      const t = await resp.text();
      return res.status(502).json({ error: "Upstream error", detail: t.slice(0, 500) });
    }
    const data = await resp.json();

    // Normalize results
    let items = [];
    if (mode === "news") {
      const news = data?.news_results || [];
      items = news.slice(0, num).map(n => ({
        title: n.title,
        link: n.link,
        snippet: n.snippet || n.source,
        source: n.source,
        date: n.date,
      }));
    } else {
      const organic = data?.organic_results || [];
      items = organic.slice(0, num).map(r => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet,
        source: r.source || (r.displayed_link ?? ""),
      }));
    }

    res.status(200).json({ results: items });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unknown error" });
  }
}
