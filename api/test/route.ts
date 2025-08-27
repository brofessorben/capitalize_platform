export async function POST(req: Request) {
  let body = {};
  try { body = await req.json(); } catch {}
  return Response.json({ ok: true, body });
}

export async function GET() {
  return Response.json({ ok: true, route: "/api/test" });
}
