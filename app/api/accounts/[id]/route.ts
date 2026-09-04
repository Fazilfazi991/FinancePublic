import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const a = await req.json();
    await sql`UPDATE accounts SET name=${a.name}, institution=${a.institution}, type=${a.type},
      currency=${a.currency}, opening_balance=${a.openingBalance}, color=${a.color},
      is_default=${a.isDefault || false}, notes=${a.notes || ''}, tag=${a.tag || ''}, icon=${a.icon || 'wallet'}
      WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM accounts WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
