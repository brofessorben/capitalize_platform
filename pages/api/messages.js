// pages/api/messages.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const lead_id = String(req.query.lead_id || "");
      const limit = Number(req.query.limit || 200);
      if (!lead_id) return res.status(400).json({ error: "lead_id required" });

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("lead_id", lead_id)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return res.status(200).json({ ok: true, messages: data ?? [] });
    }

    if (req.method === "POST") {
      const { lead_id, sender, role = "user", text } = req.body || {};
      if (!lead_id || !sender || !text) {
        return res.status(400).json({ error: "lead_id, sender, text required" });
      }

      const { data, error } = await supabase
        .from("messages")
        .insert([{ lead_id, sender, role, text }])
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ ok: true, message: data });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: "messages endpoint error", details: String(err?.message || err) });
  }
}
