import { describe, expect, it } from 'vitest';
import { getAccountBalance } from './utils';

const settings = { aedToInr: 25 };
const accounts = [
  { id: 'source', openingBalance: 1000, currency: 'INR' },
  { id: 'destination', openingBalance: 200, currency: 'INR' },
];

describe('account detail transaction accounting', () => {
  const transactions = [
    { type: 'income', amount: 500, accountId: 'source', currency: 'INR' },
    { type: 'expense', amount: 200, accountId: 'source', currency: 'INR' },
    { type: 'transfer', amount: 300, accountId: 'source', toAccountId: 'destination', currency: 'INR' },
  ];

  it('applies income, expense, and both sides of an internal transfer', () => {
    expect(getAccountBalance('source', accounts, transactions, settings)).toBe(1000);
    expect(getAccountBalance('destination', accounts, transactions, settings)).toBe(500);
  });

  it('does not classify an internal transfer as income or expense', () => {
    expect(transactions.filter(transaction => transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amount, 0)).toBe(500);
    expect(transactions.filter(transaction => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0)).toBe(200);
  });

  it('recalculates an edited expense from the ledger without duplicating it', () => {
    const edited = [{ type: 'expense', amount: 150, accountId: 'source', currency: 'INR' }];
    expect(edited).toHaveLength(1);
    expect(getAccountBalance('source', accounts, edited, settings)).toBe(850);
  });

  it('recalculates edited and deleted income from the ledger', () => {
    expect(getAccountBalance('source', accounts, [{ type: 'income', amount: 150, accountId: 'source', currency: 'INR' }], settings)).toBe(1150);
    expect(getAccountBalance('source', accounts, [], settings)).toBe(1000);
  });

  it('recalculates an edited, retargeted, and deleted transfer', () => {
    const threeAccounts = [...accounts, { id: 'wallet', openingBalance: 100, currency: 'INR' }];
    const edited = [{ type: 'transfer', amount: 500, accountId: 'source', toAccountId: 'destination', currency: 'INR' }];
    expect(getAccountBalance('source', threeAccounts, edited, settings)).toBe(500);
    expect(getAccountBalance('destination', threeAccounts, edited, settings)).toBe(700);
    const retargeted = [{ ...edited[0], amount: 300, toAccountId: 'wallet' }];
    expect(getAccountBalance('source', threeAccounts, retargeted, settings)).toBe(700);
    expect(getAccountBalance('destination', threeAccounts, retargeted, settings)).toBe(200);
    expect(getAccountBalance('wallet', threeAccounts, retargeted, settings)).toBe(400);
    expect(getAccountBalance('source', threeAccounts, [], settings)).toBe(1000);
    expect(getAccountBalance('destination', threeAccounts, [], settings)).toBe(200);
  });
});
