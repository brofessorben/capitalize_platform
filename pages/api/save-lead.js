// pages/api/save-lead.js
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  const { referrer = {}, host = {}, vendor = {}, notes = "" } = req.body || {};

  try {
    if (!url || !key) {
      return res.status(200).json({
        saved: false,
        message: "No Supabase env set — lead not persisted (that’s OK for now).",
      });
    }

    const supabase = createClient(url, key);
    const payload = {
      referrer_name: referrer.name || null,
      referrer_email: referrer.email || null,
      host_name: host.name || null,
      host_contact: host.contact || null,
      vendor_name: vendor.name || null,
      vendor_contact: vendor.contact || null,
      vendor_website: vendor.website || null,
      notes: notes || null,
    };

    const { data, error } = await supabase.from("leads").insert(payload).select().single();
    if (error) {
      // If the table doesn't exist yet, don’t hard fail
      console.error("save-lead supabase error:", error);
      return res.status(200).json({
        saved: false,
        message:
          "Supabase insert failed (table missing?). Lead not persisted but your draft is ready.",
      });
    }

    return res.status(200).json({ saved: true, lead: data });
  } catch (e) {
    console.error("save-lead error", e);
    return res.status(200).json({
      saved: false,
      message: "Couldn’t save right now. Copy your draft and continue.",
    });
  }
}
