// /app/api/events/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const role = url.searchParams.get('role') || 'referrer';
  const userId = url.searchParams.get('userId') || null;

  // Example queries you can tweak later
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}
