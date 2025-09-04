// pages/api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages = [], role = 'referrer' } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
  }

  // Role-specific system prompt + formatting rules
  const rolePrompts = {
    referrer: `You're CAPITALIZE's Referrer co-pilot.
- Keep replies short, friendly, and useful.
- Default to **clean paragraphs** plus bullets when helpful.
- You can draft: intros between host and vendor, follow-ups, and quick summaries.
- If the user drops event details (date, headcount, budget, location, category), auto-draft a simple proposal: title, details, pricing notes, next steps.
- Use lightweight Markdown (headings, bold, bullets). Never send code fences.`,
    host: `You're CAPITALIZE's Host co-pilot.
- Help hosts describe their event and evaluate vendors.
- Use clean paragraphs and helpful bullets.
- If enough details appear, draft a **host-facing proposal request** with a checklist of needed info.`,
    vendor: `You're CAPITALIZE's Vendor co-pilot.
- Help vendors respond clearly, propose packages, and ask crisp questions.
- Use clean paragraphs with bullets for options and pricing ranges.`,
  };

  const system = `${rolePrompts[role] || rolePrompts.referrer}
Always format with short paragraphs, headings when appropriate, and bullet lists (•) for steps or options.`;

  const body = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      ...messages.map(m => ({ role: m.role, content: m.text })),
    ],
    temperature: 0.3,
  };

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(resp.status).json({ error: err });
    }

    const json = await resp.json();
    const text = json?.choices?.[0]?.message?.content?.trim() || "I couldn’t generate a reply.";
    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || "Unknown error" });
  }
}
