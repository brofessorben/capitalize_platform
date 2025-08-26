import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    res.status(200).json({ ok: true, body: req.body });
  } else {
    res.status(405).json({ error: "Only POST allowed" });
  }
}
