// Simple time endpoint for health/demo
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    now: new Date().toISOString()
  });
}
