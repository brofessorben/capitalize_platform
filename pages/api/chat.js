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
  // Check if the request method is POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Extract and validate request body
  const { lead_id, sender = "vendor", text } = req.body || {};
  if (!lead_id || !text) {
    return res.status(400).json({ error: "lead_id and text are required" });
  }

  try {
    // Save the user's message to Supabase
    const { error: insertError } = await supabase
      .from("messages")
      .insert([{ lead_id, sender, role: "user", text }]);
    if (insertError) throw new Error(insertError.message);

    // Fetch message history for the lead
    const { data: history, error: historyError } = await supabase
      .from("messages")
      .select("*")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: true });
    if (historyError) throw new Error(historyError.message);

    // Prepare messages for OpenAI with system prompt
    const messages = [
      {
        role: "system",
        content:
          "You help a vendor and host finalize event details (pricing, headcount, date, add-ons). Be concise, actionable, and polite. Ask for missing info. Suggest the next best step.",
      },
      ...history.map((m) => ({ role: m.role, content: m.text })),
    ];

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });
    const reply = completion.choices?.[0]?.message?.content || "OK";

    // Save AI response to Supabase
    const { error: aiError } = await supabase
      .from("messages")
      .insert([{ lead_id, sender: "ai", role: "assistant", text: reply }]);
    if (aiError) throw new Error(aiError.message);

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
