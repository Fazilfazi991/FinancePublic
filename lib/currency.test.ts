import { describe, expect, it } from 'vitest';
import { hasValidBaseCurrency, isSupportedCurrency } from './currency';

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
});
