// pages/api/messages.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    switch (req.method) {
      // GET /api/messages?lead_id=...&limit=100
      case "GET": {
        const { lead_id, limit } = req.query;
        if (!lead_id) return res.status(400).json({ error: "lead_id required" });

        let q = supabase
          .from("messages")
          .select("*")
          .eq("lead_id", String(lead_id))
          .order("created_at", { ascending: true });

        if (limit) q = q.limit(Number(limit));

        const { data, error } = await q;
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ messages: data || [] });
      }

      // POST /api/messages  { lead_id, sender, text }
      // (optional helper for user-sent messages without AI reply)
      case "POST": {
        const { lead_id, sender = "vendor", text, role = "user" } = req.body || {};
        if (!lead_id || !text) {
          return res.status(400).json({ error: "lead_id and text required" });
        }
        const { data, error } = await supabase
          .from("messages")
          .insert([{ lead_id, sender, role, text }])
          .select("*")
          .single();

        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ message: data });
      }

      default:
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
