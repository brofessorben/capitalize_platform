import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM = `
You are Capitalize Assistant. Be proactive, clear, and concise.
Capabilities:
- Explain the app (Referrer, Vendor, Host), flows, and basic how-tos.
- Help write/refine outreach, proposals, and messages.
- Answer general event questions if relevant or requested.
Guardrails:
- Don’t claim to do actions you can’t (book, pay out, email). Say how to do it in the UI.
- No sensitive or illegal guidance.
- If truly off-topic, answer briefly if harmless, then offer to return to the app.
Voice:
- Friendly, direct, confident. Prefer numbered steps and short bullets.
`;

const ROLE_SNIPPETS = {
  vendor: `Focus on lead inbox, proposals, negotiation tips, pricing structure, response speed.`,
  host: `Focus on creating requests, comparing proposals, confirming details, payments.`,
  referrer: `Focus on dropping leads, good-intake questions, tracking rewards.`,
  guest: `Guide user to pick a role and outline what each one can do.`
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { role = "guest", userId = "anon", question = "" } = req.body || {};

    const system = [
      SYSTEM,
      `User: ${userId}`,
      `Role context: ${ROLE_SNIPPETS[role] || ROLE_SNIPPETS.guest}`
    ].join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: question }
      ],
      temperature: 0.5,
      max_tokens: 400
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "I’m here.";
    return res.status(200).json({ ok: true, reply });
  } catch (err) {
    return res.status(500).json({ error: "Assistant error", details: String(err?.message || err) });
  }
}
