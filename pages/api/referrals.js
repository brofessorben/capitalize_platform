import { createClient } from "@supabase/supabase-js";

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

export default async function handler(req, res) {
  const supabase = sb();

  try {
    if (req.method === "POST") {
      const { id, host_email, vendor_id, note, status } = req.body || {};

      if (!host_email || !vendor_id) {
        res.status(400).json({ ok: false, error: "host_email_and_vendor_id_required" });
        return;
      }

      const record = {
        id: id || crypto.randomUUID(),
        host_email,
        vendor_id,
        note: note ?? null,
        status: status ?? "PENDING",
      };

      const { data, error } = await supabase
        .from("referrals")
        .insert([record])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ ok: true, referral: data });
      return;
    }

    if (req.method === "GET") {
      const { host_email, vendor_id } = req.query || {};
      let q = supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(100);

      if (host_email) q = q.eq("host_email", host_email);
      if (vendor_id) q = q.eq("vendor_id", vendor_id);

      const { data, error } = await q;
      if (error) throw error;
      res.status(200).json({ ok: true, referrals: data });
      return;
    }

    res.status(405).end(); // method not allowed
  } catch (err) {
    res.status(500).json({ ok: false, error: err?.message ?? "unknown_error" });
  }
}
