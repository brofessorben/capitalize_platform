import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      // Parse raw body if needed
      const body = req.body || {};
      res.status(200).json({ ok: true, body });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Server error" });
    }
  } else {
    res.status(405).json({ error: "Only POST allowed" });
  }
}
