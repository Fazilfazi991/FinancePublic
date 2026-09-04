import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM expenses ORDER BY name`;
    const expenses = rows.map((r: any) => ({
      id: r.id, name: r.name, budgeted: Number(r.budgeted), spent: Number(r.spent), category: r.category
    }));
    return NextResponse.json(expenses);
  } catch { return NextResponse.json([]); }
}

export async function POST(req: Request) {
  try {
    const e = await req.json();
    await sql`INSERT INTO expenses (id, name, budgeted, spent, category)
      VALUES (${e.id}, ${e.name}, ${e.budgeted}, ${e.spent || 0}, ${e.category})`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
