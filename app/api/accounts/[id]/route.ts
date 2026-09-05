import { NextResponse } from 'next/server';
import { apiError, requireUser } from '@/lib/api-auth';
import { mapAccount, remove } from '@/lib/finance-api';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const row = mapAccount(await request.json());
  if (row.is_default) {
    const { error } = await auth.supabase.from('accounts').update({ is_default: false }).eq('user_id', auth.user.id).neq('id', id);
    if (error) return apiError('Unable to update the default account', 400);
  }
  const { data, error } = await auth.supabase.from('accounts').update(row).eq('id', id).eq('user_id', auth.user.id).select().maybeSingle();
  return error ? apiError('Unable to update data', 400) : data ? NextResponse.json(data) : apiError('Record not found', 404);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return remove('accounts', id);
}
