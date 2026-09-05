import { EXPENSE_RULES, INCOME_RULES } from './rules';
import type { SupportedCurrency } from '../currency';

export type QuickEntryType = 'expense' | 'income' | 'debt_payment' | 'transfer' | 'unknown';
export type QuickEntryConfidence = 'high' | 'medium' | 'low';
export interface QuickEntryDebt { id: string; name: string }
export interface QuickEntryDraft {
  type: QuickEntryType; amount: number | null; currency: SupportedCurrency; description: string;
  category: string | null; date: string; debt_id: string | null; account_id: string | null;
  confidence: QuickEntryConfidence; needs_confirmation: boolean; warnings: string[]; raw_input: string;
}
export interface ParseQuickEntryOptions { today?: string; debts?: QuickEntryDebt[]; defaultAccountId?: string | null; baseCurrency?: SupportedCurrency }

const AMOUNT = /(?:₹\s*)?(-?\d[\d,]*(?:\.\d+)?)\s*(lakh|k)?\b/i;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const title = (value: string) => value.replace(/\b\w/g, letter => letter.toUpperCase());
const isoToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const previousDay = (iso: string) => {
  const date = new Date(`${iso}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - 1); return date.toISOString().slice(0, 10);
};
const categoryFor = (text: string, rules: ReadonlyArray<[string, readonly string[]]>) =>
  rules.find(([, words]) => words.some(word => text.includes(word)))?.[0] ?? null;

export function parseQuickEntry(rawInput: string, options: ParseQuickEntryOptions = {}): QuickEntryDraft {
  const raw = rawInput.trim();
  const normalized = normalize(raw);
  const today = options.today ?? isoToday();
  const amountMatch = raw.match(AMOUNT);
  let amount: number | null = null;
  if (amountMatch) {
    const numeric = Number(amountMatch[1].replaceAll(',', ''));
    const multiplier = amountMatch[2]?.toLowerCase() === 'lakh' ? 100000 : amountMatch[2]?.toLowerCase() === 'k' ? 1000 : 1;
    const value = numeric * multiplier;
    if (Number.isFinite(value) && value > 0 && Math.round(value * 100) === value * 100) amount = value;
  }
  const date = /\byesterday\b/.test(normalized) ? previousDay(today) : today;
  const incomeCategory = categoryFor(normalized, INCOME_RULES);
  const expenseCategory = categoryFor(normalized, EXPENSE_RULES);
  const incomeSignal = Boolean(incomeCategory || /\b(received|income|earned)\b/.test(normalized));
  const paymentSignal = /\b(payment|paid)\b/.test(normalized);
  const debts = options.debts ?? [];
  const matchedDebts = paymentSignal ? debts.filter(debt => {
    const debtName = normalize(debt.name);
    return debtName.length > 2 && (` ${normalized} `).includes(` ${debtName} `);
  }) : [];
  let type: QuickEntryType = 'unknown';
  if (incomeSignal && !paymentSignal) type = 'income';
  else if (paymentSignal && matchedDebts.length > 0) type = 'debt_payment';
  else if (expenseCategory || /\b(spent|expense)\b/.test(normalized) || (!paymentSignal && !/\bloan\b/.test(normalized) && amount !== null && normalized.replace(/\d[\d,.]*/g, '').trim().length > 1)) type = 'expense';
  const warnings: string[] = [];
  if (!amount) warnings.push('Enter an amount greater than zero.');
  if (paymentSignal && matchedDebts.length === 0 && type === 'unknown') warnings.push('Select the debt this payment belongs to.');
  if (matchedDebts.length > 1) warnings.push('More than one debt matches. Select the correct debt.');
  if (type === 'unknown') warnings.push('Select whether this is an expense, income, or debt payment.');
  if (!options.defaultAccountId) warnings.push('Select an account before confirming.');
  const stripped = raw
    .replace(AMOUNT, ' ').replace(/\b(today|yesterday|spent|received|income|earned|paid|payment|towards?|on)\b/gi, ' ')
    .replace(/\s+/g, ' ').trim();
  const description = title(stripped || (type === 'income' ? incomeCategory ?? 'Income' : type === 'debt_payment' ? matchedDebts[0]?.name ?? 'Debt Payment' : expenseCategory ?? 'Transaction'));
  const category = type === 'income' ? incomeCategory ?? 'Other' : type === 'expense' ? expenseCategory ?? 'Other' : type === 'debt_payment' ? 'Debt Payment' : null;
  const requiredResolved = amount !== null && type !== 'unknown' && Boolean(options.defaultAccountId) && (type !== 'debt_payment' || matchedDebts.length === 1);
  const confidence: QuickEntryConfidence = requiredResolved && (category !== 'Other' || type === 'debt_payment') ? 'high' : type !== 'unknown' && amount ? 'medium' : 'low';
  return { type, amount, currency: options.baseCurrency ?? 'INR', description, category, date, debt_id: matchedDebts.length === 1 ? matchedDebts[0].id : null,
    account_id: options.defaultAccountId ?? null, confidence, needs_confirmation: true, warnings, raw_input: rawInput };
}
