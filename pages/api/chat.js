// pages/api/chat.js
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { lead_id, sender = "vendor", text = "" } = req.body || {};
  if (!lead_id || !text) {
    return res.status(400).json({ error: "lead_id and text required" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // store the user's message
    await supabase.from("messages").insert({
      lead_id,
      sender,
      role: "user",
      text,
    });

    // simple placeholder reply (no OpenAI call, keeps build simple)
    const reply = `Got it from ${sender}: "${text}"`;

    // store AI reply
    await supabase.from("messages").insert({
      lead_id,
      sender: "ai",
      role: "assistant",
      text: reply,
    });

    return res.status(200).json({ ok: true, reply });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Chat error", details: String(err?.message || err) });
  }
}          ],
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
