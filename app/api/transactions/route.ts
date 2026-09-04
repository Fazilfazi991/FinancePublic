import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM transactions ORDER BY date DESC, created_at DESC`;
    const txns = rows.map((r: any) => ({
      id: r.id, type: r.type, amount: Number(r.amount), accountId: r.account_id,
      toAccountId: r.to_account_id || undefined, category: r.category, description: r.description,
      date: r.date, currency: r.currency, createdAt: r.created_at,
      incomeStreamId: r.income_stream_id || undefined, notes: r.notes || ''
    }));
    return NextResponse.json(txns);
  } catch { return NextResponse.json([]); }
}

export async function POST(req: Request) {
  try {
    const t = await req.json();
    await sql`INSERT INTO transactions (id, type, amount, account_id, to_account_id, category, description, date, currency, created_at, income_stream_id, notes)
      VALUES (${t.id}, ${t.type}, ${t.amount}, ${t.accountId}, ${t.toAccountId || null}, ${t.category}, ${t.description}, ${t.date}, ${t.currency}, ${t.createdAt}, ${t.incomeStreamId || null}, ${t.notes || ''})`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
