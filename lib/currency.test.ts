import { describe, expect, it } from 'vitest';
import { getBaseCurrency, hasValidBaseCurrency, isSupportedCurrency, resolveQuickEntryAccount } from './currency';

describe('base currency setup', () => {
  it.each(['INR', 'USD', 'AED', 'EUR'])('treats supported %s profiles as complete', base_currency => {
    expect(hasValidBaseCurrency({ base_currency })).toBe(true);
  });

  it.each([null, undefined, '', '   ', 'XYZ', 'US'])('requires setup for %s', base_currency => {
    expect(hasValidBaseCurrency({ base_currency })).toBe(false);
  });

  it('does not depend on onboarding_completed', () => {
    expect(hasValidBaseCurrency({ base_currency: 'INR', onboarding_completed: false } as never)).toBe(true);
  });

  it('normalizes supported codes without accepting unknown codes', () => {
    expect(isSupportedCurrency(' usd ')).toBe(true);
    expect(isSupportedCurrency('XYZ')).toBe(false);
  });

  it('returns the normalized persisted currency', () => {
    expect(getBaseCurrency({ base_currency: ' usd ' })).toBe('USD');
  });

  it('reports no eligible accounts', () => {
    expect(resolveQuickEntryAccount([], 'INR').status).toBe('none');
  });

  it('automatically selects one eligible account', () => {
    const result = resolveQuickEntryAccount([{ id: 'only', currency: 'INR', type: 'savings', is_default: false }], 'INR');
    expect(result.account?.id).toBe('only');
  });

  it('uses the default when multiple accounts are eligible', () => {
    const result = resolveQuickEntryAccount([
      { id: 'cash', currency: 'INR', type: 'cash', is_default: false },
      { id: 'bank', currency: 'INR', type: 'savings', is_default: true },
    ], 'INR');
    expect(result.account?.id).toBe('bank');
  });

  it('requires a default when multiple accounts are eligible without one', () => {
    const result = resolveQuickEntryAccount([
      { id: 'cash', currency: 'INR', type: 'cash', is_default: false },
      { id: 'bank', currency: 'INR', type: 'savings', is_default: false },
    ], 'INR');
    expect(result.status).toBe('needs_default');
  });
});
