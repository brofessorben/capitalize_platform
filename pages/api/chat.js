// pages/api/chat.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Optional: OpenAI via fetch (no SDK needed)
async function getAIReply({ lead_id, sender, text }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return `Echo (${sender}): ${text}`; // fallback if key is missing
  }

  const sys = `You are a helpful assistant that helps three parties (vendor, host, referrer) move an event deal forward. 
Keep replies short, specific, and actionable.`;

  const userMsg = `Lead ${lead_id} • ${sender} says: ${text}`;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMsg }
      ],
      max_tokens: 200,
      temperature: 0.6,
    }),
  });

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  return content || `Echo (${sender}): ${text}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lead_id, sender = "vendor", text = "" } = req.body || {};
    if (!lead_id || !text) return res.status(400).json({ error: "lead_id and text required" });

    // (Client already does optimistic insert; this is server-side truth if you want it)
    await supabase.from("messages").insert([{ lead_id, sender, role: "user", text }]);

    const reply = await getAIReply({ lead_id, sender, text });

    // Save AI reply
    await supabase
      .from("messages")
      .insert([{ lead_id, sender: "ai", role: "assistant", text: reply }]);

    return res.status(200).json({ ok: true, reply });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Chat error", details: String(err?.message || err) });
  }
}
