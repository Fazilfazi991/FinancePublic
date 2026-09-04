import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const i = await req.json();
    await sql`UPDATE incomes SET name=${i.name}, type=${i.type}, status=${i.status}, currency=${i.currency},
      expected_monthly=${i.expectedMonthly}, actual_this_month=${i.actualThisMonth || 0}, notes=${i.notes || ''},
      color=${i.color}, icon=${i.icon}, linked_account_id=${i.linkedAccountId || ''} WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM incomes WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
