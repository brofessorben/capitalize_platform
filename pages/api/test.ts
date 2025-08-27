// pages/api/test.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_ANON_KEY as string
    );

    if (req.method === "GET") {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      res.status(200).json({ ok: true, supabase_ready: true });
      return;
    }

    if (req.method === "POST") {
      res.status(200).json({ ok: true, supabase_ready: true, echo: req.body ?? null });
      return;
    }

    res.status(405).end();
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message ?? "unknown_error" });
  }
}
