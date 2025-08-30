import { createClient } from "@supabase/supabase-js";

// Connect to Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { host, vendor, referrer, notes } = req.body;

    const { data, error } = await supabase
      .from("leads")
      .insert([{ host, vendor, referrer, notes }])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ lead: data[0] });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ leads: data });
  }

  res.status(405).json({ error: "Method not allowed" });
}
