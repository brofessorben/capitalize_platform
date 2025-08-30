// pages/api/leads.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case "POST": {
        const { host = "", vendor = "", referrer = "", notes = "" } = req.body || {};
        if (!host || !vendor || !referrer) {
          return res.status(400).json({ error: "host, vendor, and referrer are required" });
        }

        const { data, error } = await supabase
          .from("leads")
          .insert([{ host: host.trim(), vendor: vendor.trim(), referrer: referrer.trim(), notes }])
          .select("*")
          .single();

        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ lead: data });
      }

      case "GET": {
        const { status, limit } = req.query;
        let q = supabase.from("leads").select("*").order("created_at", { ascending: false });
        if (status) q = q.eq("status", String(status));
        if (limit) q = q.limit(Number(limit));

        const { data, error } = await q;
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ leads: data || [] });
      }

      default:
        res.setHeader("Allow", "GET, POST");
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
