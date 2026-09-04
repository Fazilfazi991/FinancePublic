import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM transactions WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }, { status: 500 }); }
}
