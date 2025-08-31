// Minimal chat API — works even without OpenAI key.
// If OPENAI_API_KEY is set, it will use it; otherwise it echoes a helpful reply.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { lead_id, sender, text } = req.body || {};
    if (!text) return res.status(400).json({ error: "Missing text" });

    // Default fallback reply (no key needed)
    let reply = `Got it. For lead "${lead_id}", from ${sender}: “${text}”. Next step: ask date, headcount, budget, and timeline.`;

    // If you have an OpenAI key, we'll use it for a smarter reply
    if (process.env.OPENAI_API_KEY) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a concise negotiator assistant for events. Give short, actionable replies to move the deal forward.",
            },
            {
              role: "user",
              content: `Sender: ${sender}\nLead: ${lead_id}\nMessage: ${text}\nReply with the next best step.`,
            },
          ],
          max_tokens: 160,
          temperature: 0.6,
        }),
      });

      const j = await r.json();
      reply = j?.choices?.[0]?.message?.content?.trim() || reply;
    }

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Chat error", details: String(err?.message || err) });
  }
}      .eq("lead_id", lead_id)
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
