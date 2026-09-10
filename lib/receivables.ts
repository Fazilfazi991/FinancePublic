import { z } from 'zod';

export interface ReceivablePayment {
  id: string; user_id: string; receivable_id: string; transaction_id: string;
  amount: number; destination_account_id: string; payment_date: string;
  notes: string; created_at: string; updated_at: string;
}
export interface Receivable {
  id: string; user_id: string; person_name: string; original_amount: number;
  outstanding_amount: number; source_account_id: string; currency: string;
  transaction_id: string; lent_date: string; due_date: string | null;
  notes: string; created_at: string; updated_at: string;
  receivable_payments: ReceivablePayment[];
}
export function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function receivableStatus(r: Pick<Receivable,'outstanding_amount'|'original_amount'|'due_date'>, today = localDate()) {
  if (Number(r.outstanding_amount) === 0) return 'Settled';
  if (r.due_date && r.due_date < today) return 'Overdue';
  return Number(r.outstanding_amount) < Number(r.original_amount) ? 'Partially Paid' : 'Active';
}
const amount = z.number().finite().positive().max(9000000000000).multipleOf(.01);
export const receivableMutationSchema = z.object({
  action: z.enum(['create','update','delete','payment_create','payment_update','payment_delete']),
  id: z.string().uuid(), receivableId: z.string().uuid().optional(),
  personName: z.string().trim().min(1).max(100).optional(), amount: amount.optional(),
  accountId: z.string().uuid().optional(), date: z.iso.date().optional(),
  dueDate: z.iso.date().nullable().optional(), notes: z.string().max(500).default(''),
}).superRefine((v, ctx) => {
  const deleting = v.action.endsWith('delete');
  if (!deleting && (!v.amount || !v.accountId || !v.date)) ctx.addIssue({code:'custom',message:'Amount, account and date are required.'});
  if (['create','update'].includes(v.action) && !v.personName) ctx.addIssue({code:'custom',message:'Person name is required.'});
  if (v.action.startsWith('payment_') && !v.receivableId) ctx.addIssue({code:'custom',message:'Money to receive is required.'});
  if (v.dueDate && v.date && v.dueDate < v.date) ctx.addIssue({code:'custom',message:'Due date must be on or after the date lent.'});
});
export type ReceivableMutation = z.infer<typeof receivableMutationSchema>;
