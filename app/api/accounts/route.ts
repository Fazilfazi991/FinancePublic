import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM accounts ORDER BY name`;
    const accounts = rows.map((r: any) => ({
      id: r.id, name: r.name, institution: r.institution, type: r.type,
      currency: r.currency, openingBalance: Number(r.opening_balance), color: r.color,
      createdAt: r.created_at, isDefault: r.is_default, notes: r.notes || '',
      tag: r.tag || '', icon: r.icon || 'wallet'
    }));
    return NextResponse.json(accounts);
  } catch { return NextResponse.json([]); }
}

export async function POST(req: Request) {
  try {
    const a = await req.json();
    await sql`INSERT INTO accounts (id, name, institution, type, currency, opening_balance, color, created_at, is_default, notes, tag, icon)
      VALUES (${a.id}, ${a.name}, ${a.institution}, ${a.type}, ${a.currency}, ${a.openingBalance}, ${a.color}, ${a.createdAt}, ${a.isDefault || false}, ${a.notes || ''}, ${a.tag || ''}, ${a.icon || 'wallet'})`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
