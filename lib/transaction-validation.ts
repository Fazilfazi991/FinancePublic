import { z } from 'zod';

const optionalUuid = z.preprocess(value => value === '' ? undefined : value, z.string().uuid().optional());

export const transactionInputSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']), amount: z.number().positive().multipleOf(.01),
  accountId: z.string().uuid(), toAccountId: optionalUuid, category: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200), date: z.iso.date(), currency: z.string().regex(/^[A-Z]{3}$/),
  notes: z.string().max(500).optional(), incomeStreamId: optionalUuid,
  source: z.enum(['manual', 'quick_entry']).default('manual'), idempotencyKey: z.string().uuid().optional(),
}).superRefine((value, context) => {
  if (value.type === 'transfer' && !value.toAccountId) context.addIssue({ code: 'custom', path: ['toAccountId'], message: 'A destination account is required.' });
  if (value.type === 'transfer' && value.accountId === value.toAccountId) context.addIssue({ code: 'custom', path: ['toAccountId'], message: 'The destination account must be different.' });
  if (value.type !== 'transfer' && value.toAccountId) context.addIssue({ code: 'custom', path: ['toAccountId'], message: 'Only transfers can have a destination account.' });
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;
export const transactionRow = (input: TransactionInput) => ({
  type: input.type, amount: input.amount, account_id: input.accountId,
  to_account_id: input.toAccountId ?? null, category: input.type === 'transfer' ? 'Transfer' : input.category,
  description: input.description, transaction_date: input.date, currency: input.currency,
  income_stream_id: input.type === 'income' ? input.incomeStreamId ?? null : null, notes: input.notes ?? '',
});
