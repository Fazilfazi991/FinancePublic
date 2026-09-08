import { z } from 'zod';
import { NextResponse } from 'next/server';
import { apiError, requireUser } from '@/lib/api-auth';
import { transactionInputSchema, transactionRow } from '@/lib/transaction-validation';

type Context = { params: Promise<{ id: string }> };
const idSchema = z.string().uuid();

async function ownedTransaction(id: string) {
  const auth = await requireUser();
  if ('response' in auth) return auth;
  const { data, error } = await auth.supabase.from('transactions').select('id').eq('id', id).eq('user_id', auth.user.id).maybeSingle();
  if (error) return { response: apiError('Unable to load transaction', 500) } as const;
  if (!data) return { response: apiError('Transaction not found', 404) } as const;
  return auth;
}

export async function PATCH(request: Request, { params }: Context) {
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) return apiError('Invalid transaction ID');
  const auth = await ownedTransaction(parsedId.data);
  if ('response' in auth) return auth.response;
  const parsed = transactionInputSchema.safeParse(await request.json());
  if (!parsed.success) return apiError('Invalid transaction details');
  const input = parsed.data;
  const accountIds = [input.accountId, input.toAccountId].filter(Boolean) as string[];
  const { data: accounts, error: accountError } = await auth.supabase.from('accounts').select('id,currency').eq('user_id', auth.user.id).in('id', accountIds);
  if (accountError || accounts?.length !== new Set(accountIds).size) return apiError('Account not found', 404);
  if (accounts.some(account => account.currency !== input.currency)) return apiError('Transaction currency must match the selected account.');
  if (input.incomeStreamId) {
    const { data } = await auth.supabase.from('incomes').select('id').eq('id', input.incomeStreamId).eq('user_id', auth.user.id).maybeSingle();
    if (!data) return apiError('Income source not found', 404);
  }
  const row = transactionRow(input);
  const { data, error } = await auth.supabase.rpc('update_owned_transaction', {
    p_transaction_id: parsedId.data, p_type: row.type, p_amount: row.amount,
    p_account_id: row.account_id, p_to_account_id: row.to_account_id, p_category: row.category,
    p_description: row.description, p_transaction_date: row.transaction_date, p_currency: row.currency,
    p_income_stream_id: row.income_stream_id, p_notes: row.notes,
  });
  return error ? apiError(error.message.includes('linked_debt_payment') ? 'Debt payments must remain expenses in the Debt Payment category.' : 'Unable to update transaction', 400) : NextResponse.json(data);
}

export const PUT = PATCH;

export async function DELETE(_: Request, { params }: Context) {
  const parsedId = idSchema.safeParse((await params).id);
  if (!parsedId.success) return apiError('Invalid transaction ID');
  const auth = await ownedTransaction(parsedId.data);
  if ('response' in auth) return auth.response;
  const { data, error } = await auth.supabase.rpc('delete_owned_transaction', { p_transaction_id: parsedId.data });
  return error ? apiError('Unable to delete transaction', 400) : NextResponse.json({ ok: true, ...data });
}
