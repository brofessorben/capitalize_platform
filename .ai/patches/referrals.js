// pages/api/referrals.js (copied in by workflow)
// Minimal POST endpoint with input validation (no DB yet).

function bad(res, status, msg, details = undefined) {
  res.status(status).json({ ok: false, error: msg, details });
}

function isEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default async function handler(req, res) {
  // CORS (basic)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return bad(res, 405, "Method not allowed");
  }

  if (!req.headers["content-type"]?.includes("application/json")) {
    return bad(res, 415, "Content-Type must be application/json");
  }

  let body;
  try {
    body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
  } catch {
    return bad(res, 400, "Invalid JSON body");
  }

  const { host, vendor, referrer, notes } = body;

  const errors = [];
  if (!host || typeof host !== "string" || host.trim().length < 2) {
    errors.push({ field: "host", message: "host (string, ≥2 chars) is required" });
  }
  if (!vendor || typeof vendor !== "string" || vendor.trim().length < 2) {
    errors.push({ field: "vendor", message: "vendor (string, ≥2 chars) is required" });
  }
  if (!referrer || !isEmail(referrer)) {
    errors.push({ field: "referrer", message: "referrer must be a valid email" });
  }
  if (notes && typeof notes !== "string") {
    errors.push({ field: "notes", message: "notes must be a string if provided" });
  }

  if (errors.length) {
    return bad(res, 400, "Validation failed", errors);
  }

  // For now, we just echo back. (DB will come next patch.)
  const referral = {
    id: `tmp_${Date.now()}`, // placeholder
    host: host.trim(),
    vendor: vendor.trim(),
    referrer: referrer.toLowerCase(),
    notes: notes?.trim() || null,
    createdAt: new Date().toISOString(),
    source: "api",
  };

  res.status(200).json({ ok: true, referral });
}
