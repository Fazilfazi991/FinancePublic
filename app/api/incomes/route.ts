import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM incomes ORDER BY name`;
    const incomes = rows.map((r: any) => ({
      id: r.id, name: r.name, type: r.type, status: r.status, currency: r.currency,
      expectedMonthly: Number(r.expected_monthly), actualThisMonth: Number(r.actual_this_month),
      notes: r.notes || '', color: r.color, icon: r.icon, linkedAccountId: r.linked_account_id || ''
    }));
    return NextResponse.json(incomes);
  } catch { return NextResponse.json([]); }
}

export async function POST(req: Request) {
  try {
    const i = await req.json();
    await sql`INSERT INTO incomes (id, name, type, status, currency, expected_monthly, actual_this_month, notes, color, icon, linked_account_id)
      VALUES (${i.id}, ${i.name}, ${i.type}, ${i.status}, ${i.currency}, ${i.expectedMonthly}, ${i.actualThisMonth || 0}, ${i.notes || ''}, ${i.color}, ${i.icon}, ${i.linkedAccountId || ''})`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
