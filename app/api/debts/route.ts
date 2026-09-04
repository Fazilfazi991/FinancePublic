import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM debts ORDER BY balance DESC`;
    const debts = rows.map((r: any) => ({
      id: r.id, name: r.name, total: Number(r.total), balance: Number(r.balance),
      rate: Number(r.rate), minPayment: Number(r.min_payment), notes: r.notes || '', color: r.color
    }));
    return NextResponse.json(debts);
  } catch { return NextResponse.json([]); }
}

export async function POST(req: Request) {
  try {
    const d = await req.json();
    await sql`INSERT INTO debts (id, name, total, balance, rate, min_payment, notes, color)
      VALUES (${d.id}, ${d.name}, ${d.total}, ${d.balance}, ${d.rate}, ${d.minPayment}, ${d.notes || ''}, ${d.color})`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
