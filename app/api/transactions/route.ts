import { z } from 'zod';
import { NextResponse } from 'next/server';
import { apiError, requireUser } from '@/lib/api-auth';
import { list } from '@/lib/finance-api';

const optionalUuid = z.preprocess(value => value === '' ? undefined : value, z.string().uuid().optional());
const schema = z.object({
  type: z.enum(['income', 'expense', 'transfer']), amount: z.number().positive().multipleOf(.01),
  accountId: z.string().uuid(), toAccountId: optionalUuid, category: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200), date: z.iso.date(), currency: z.string().regex(/^[A-Z]{3}$/),
  notes: z.string().max(500).optional(), incomeStreamId: optionalUuid,
  source: z.enum(['manual', 'quick_entry']).default('manual'), idempotencyKey: z.string().uuid().optional(),
}).superRefine((value, context) => { if (value.type === 'transfer' && !value.toAccountId) context.addIssue({code:'custom',path:['toAccountId'],message:'A destination account is required.'}); });

export const GET = () => list('transactions', 'transaction_date');
export async function POST(request: Request) {
  const auth = await requireUser(); if ('response' in auth) return auth.response;
  let input: z.infer<typeof schema>; try { input = schema.parse(await request.json()); } catch { return apiError('Invalid transaction details'); }
  const accountIds = [input.accountId, input.toAccountId].filter(Boolean) as string[];
  const { data: accounts, error: accountError } = await auth.supabase.from('accounts').select('id,currency').eq('user_id', auth.user.id).in('id', accountIds);
  if (accountError || accounts?.length !== new Set(accountIds).size) return apiError('Account not found', 404);
  if (accounts.some(account => account.currency !== input.currency)) return apiError('Transaction currency must match the selected account.');
  if (input.incomeStreamId) { const { data } = await auth.supabase.from('incomes').select('id').eq('id', input.incomeStreamId).eq('user_id', auth.user.id).maybeSingle(); if (!data) return apiError('Income source not found', 404); }
  if (input.idempotencyKey) { const { data } = await auth.supabase.from('transactions').select('*').eq('user_id', auth.user.id).eq('idempotency_key', input.idempotencyKey).maybeSingle(); if (data) return NextResponse.json(data); }
  const { data, error } = await auth.supabase.from('transactions').insert({user_id:auth.user.id,type:input.type,amount:input.amount,account_id:input.accountId,to_account_id:input.toAccountId??null,category:input.category,description:input.description,transaction_date:input.date,currency:input.currency,income_stream_id:input.incomeStreamId??null,notes:input.notes??'',source:input.source,idempotency_key:input.idempotencyKey??null}).select().single();
  if (error?.code === '23505' && input.idempotencyKey) { const { data: existing } = await auth.supabase.from('transactions').select('*').eq('user_id',auth.user.id).eq('idempotency_key',input.idempotencyKey).single(); return existing ? NextResponse.json(existing) : apiError('Unable to save transaction',409); }
  return error ? apiError('Unable to save transaction',400) : NextResponse.json(data,{status:201});
}
