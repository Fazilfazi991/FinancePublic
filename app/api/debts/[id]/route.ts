import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const d = await req.json();
    await sql`UPDATE debts SET name=${d.name}, total=${d.total}, balance=${d.balance}, rate=${d.rate},
      min_payment=${d.minPayment}, notes=${d.notes || ''}, color=${d.color} WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM debts WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
