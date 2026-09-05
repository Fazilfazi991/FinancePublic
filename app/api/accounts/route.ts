import { NextResponse } from 'next/server';
import { apiError, requireUser } from '@/lib/api-auth';
import { list, mapAccount } from '@/lib/finance-api';

export const GET = () => list('accounts', 'name');

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const row = mapAccount(await request.json());
  if (row.is_default) {
    const { error } = await auth.supabase.from('accounts').update({ is_default: false }).eq('user_id', auth.user.id);
    if (error) return apiError('Unable to update the default account', 400);
  }
  const { data, error } = await auth.supabase.from('accounts').insert({ ...row, user_id: auth.user.id }).select().single();
  return error ? apiError('Unable to save data', 400) : NextResponse.json(data, { status: 201 });
}
