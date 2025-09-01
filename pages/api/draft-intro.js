// pages/api/draft-intro.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { referrer = {}, host = {}, vendor = {}, notes = "", role = "referrer" } = req.body || {};
    const openai = process.env.OPENAI_API_KEY;

    const base = {
      subject: `Intro: ${host.name || "Host"} × ${vendor.name || "Vendor"}`,
      emailBody:
        `Hi ${host.name || "there"},\n\n` +
        `${referrer.name || "I"} wanted to introduce you to ${vendor.name || "a great vendor"}${
          vendor.website ? ` (${vendor.website})` : ""
        }.\n\n` +
        `Context: ${notes || "—"}\n` +
        `${vendor.name || "They"} can be reached at ${vendor.contact || "N/A"}.\n` +
        `Reply-all to keep us moving — happy to help finalize details.\n\n` +
        `Cheers,\n${referrer.name || "Your Referrer"}`,

      smsBody:
        `Intro: ${vendor.name || "Vendor"} ↔ ${host.name || "Host"}. ` +
        `${notes ? `Context: ${notes}. ` : ""}` +
        `Contact: ${vendor.contact || "N/A"}${vendor.website ? ` • ${vendor.website}` : ""}`,
    };

    if (!openai) {
      return res.status(200).json(base);
    }

    const system =
      "Write a crisp, friendly intro email and a short SMS that connects a host with a vendor. Keep momentum, propose a concrete next step, and stay positive.";

    const user =
      `Referrer: ${referrer.name || "N/A"} (${referrer.email || "N/A"})\n` +
      `Host: ${host.name || "N/A"} (${host.contact || "N/A"})\n` +
      `Vendor: ${vendor.name || "N/A"} (${vendor.contact || "N/A"}) ${vendor.website || ""}\n` +
      `Notes/Context: ${notes || "N/A"}\n\n` +
      `Return strict JSON with keys: subject, emailBody, smsBody.`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openai}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("draft-intro OpenAI error:", data);
      return res.status(200).json(base); // fall back to baseline
    }

    let parsed = base;
    try {
      parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}");
    } catch {
      // ignore and use base
    }

    return res.status(200).json({
      subject: parsed.subject || base.subject,
      emailBody: parsed.emailBody || base.emailBody,
      smsBody: parsed.smsBody || base.smsBody,
    });
  } catch (err) {
    console.error("draft-intro error:", err);
    return res.status(200).json({
      subject: "Intro",
      emailBody: "Quick intro here…",
      smsBody: "Intro via SMS…",
    });
  }
}
