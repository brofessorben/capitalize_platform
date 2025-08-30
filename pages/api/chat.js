// pages/api/chat.js
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { lead_id, sender = "vendor", text } = req.body || {};
  if (!lead_id || !text) {
    return res.status(400).json({ error: "lead_id and text are required" });
  }

  // 1) save the user's message
  const { error: insErr } = await supabase
    .from("messages")
    .insert([{ lead_id, sender, role: "user", text }]);
  if (insErr) return res.status(400).json({ error: insErr.message });

  // 2) load history for this lead
  const { data: history, error: histErr } = await supabase
    .from("messages")
    .select("*")
    .eq("lead_id", lead_id)
    .order("created_at", { ascending: true });
  if (histErr) return res.status(400).json({ error: histErr.message });

  // 3) call OpenAI with a focused system prompt
  const messages = [
    {
      role: "system",
      content:
        "You help a vendor and host finalize event details (pricing, headcount, date, add-ons). Be concise, actionable, and polite. Ask for missing info. Produce next best step.",
    },
    ...history.map((m) => ({ role: m.role, content: m.text })),
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
  });

  const reply = completion.choices?.[0]?.message?.content || "OK";

  // 4) save AI reply
  const { error: aiErr } = await supabase
    .from("messages")
    .insert([{ lead_id, sender: "ai", role: "assistant", text: reply }]);
  if (aiErr) return res.status(400).json({ error: aiErr.message });

  return res.status(200).json({ reply });
}
