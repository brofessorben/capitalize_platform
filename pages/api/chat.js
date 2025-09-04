// pages/api/chat.js
/**
 * Smarter chat endpoint:
 * - Strong system prompt (persona + formatting rules)
 * - Returns BOTH nicely formatted text and structured leadHints
 * - Works with OpenAI API via fetch; uses env OPENAI_API_KEY
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { messages = [], style = "" } = await req.json?.() || req.body || {};

    const system = [
      "You are CAPITALIZE's co-pilot—friendly, fast, and practical.",
      "Primary job: help referrers, vendors, and hosts move deals forward.",
      "You can also answer general questions if asked—briefly and clearly.",
      "",
      "FORMATTING:",
      "• Default to short paragraphs.",
      "• Use **bold** micro-headings when helpful.",
      "• Use bullet lists for steps, requirements, or options.",
      "• No numbered lists unless ordering matters.",
      "",
      "BEHAVIOR:",
      "• If user pastes event details, infer missing pieces and suggest next steps.",
      "• If a message contains vendor/host/referrer info, reflect it back clearly.",
      "• Be concise. No fluff. No roleplay.",
    ].join("\n");

    // Ask the model to produce BOTH nice text and a small JSON with lead fields.
    const userPrompt = [
      "You will respond in two parts:",
      "1) A helpful, well-formatted answer (Markdown).",
      "2) A compact JSON block named leadHints with any fields you can infer:",
      `   { "referrerName":"", "referrerEmail":"", "hostName":"", "hostContact":"", "vendorName":"", "vendorContact":"", "website":"", "notes":"" }`,
      "Only include fields you are reasonably confident about. If unknown, omit them.",
      style ? `STYLE HINT: ${style}` : "",
      "",
      "User messages below:"
    ].join("\n");

    const openAIMessages = [
      { role: "system", content: system },
      { role: "user", content: userPrompt },
      ...messages.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text || m.content || ""
      })),
    ];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: openAIMessages,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      res.status(500).json({ error: "Upstream error", detail: err });
      return;
    }

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content || "Sorry — I didn’t catch that.";

    // Split out the JSON block if present
    let text = raw;
    let leadHints = {};
    const jsonMatch = raw.match(/```json([\s\S]*?)```/i) || raw.match(/\{[\s\S]*\}$/);
    if (jsonMatch) {
      const block = Array.isArray(jsonMatch) ? jsonMatch[1] || jsonMatch[0] : "";
      try {
        const parsed = JSON.parse(block.trim());
        if (parsed && typeof parsed === "object") {
          leadHints = parsed;
          text = raw.replace(jsonMatch[0], "").trim();
        }
      } catch {}
    }

    res.status(200).json({ text, leadHints });
  } catch (e) {
    res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
