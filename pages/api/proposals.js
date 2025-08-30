// pages/api/proposals.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case "POST": {
        const { lead_id, vendor, terms = {}, status = "draft" } = req.body || {};
        if (!lead_id || !vendor) {
          return res.status(400).json({ error: "lead_id and vendor are required" });
        }
        const { data, error } = await supabase
          .from("proposals")
          .insert([{ lead_id, vendor: vendor.trim(), terms, status }])
          .select("*")
          .single();
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ proposal: data });
      }

      case "GET": {
        const { status, lead_id, limit } = req.query;
        let q = supabase.from("proposals").select("*").order("created_at", { ascending: false });
        if (status) q = q.eq("status", String(status));
        if (lead_id) q = q.eq("lead_id", String(lead_id));
        if (limit) q = q.limit(Number(limit));
        const { data, error } = await q;
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ proposals: data || [] });
      }

      default:
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
