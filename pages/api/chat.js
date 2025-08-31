// pages/api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sender = "vendor", text = "" } = req.body || {};
  const reply = `Got it from ${sender}: "${text}"`;

  return res.status(200).json({ ok: true, reply });
}
