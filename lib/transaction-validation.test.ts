import { describe, expect, it } from 'vitest';
import { transactionInputSchema } from './transaction-validation';

const base = { type: 'expense', amount: 100, accountId: '10000000-0000-4000-8000-000000000001', category: 'Food & Dining', description: 'Groceries', date: '2026-09-08', currency: 'INR' };

describe('transaction mutation validation', () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid amount %s', amount => expect(transactionInputSchema.safeParse({ ...base, amount }).success).toBe(false));
  it('requires different source and destination accounts', () => expect(transactionInputSchema.safeParse({ ...base, type: 'transfer', category: 'Transfer', toAccountId: base.accountId }).success).toBe(false));
  it('requires a transfer destination', () => expect(transactionInputSchema.safeParse({ ...base, type: 'transfer', category: 'Transfer' }).success).toBe(false));
  it('accepts a valid transfer', () => expect(transactionInputSchema.safeParse({ ...base, type: 'transfer', category: 'Transfer', toAccountId: '20000000-0000-4000-8000-000000000002' }).success).toBe(true));
});
