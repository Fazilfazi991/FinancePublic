export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'AED', 'EUR'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
export type CurrencyProfile = { base_currency?: unknown } | null | undefined;

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === 'string' && SUPPORTED_CURRENCIES.includes(value.trim().toUpperCase() as SupportedCurrency);
}

export function hasValidBaseCurrency(profile: CurrencyProfile): boolean {
  return isSupportedCurrency(profile?.base_currency);
}

export function getBaseCurrency(profile: CurrencyProfile): SupportedCurrency | null {
  const value = profile?.base_currency;
  return isSupportedCurrency(value) ? value.trim().toUpperCase() as SupportedCurrency : null;
}

export function findDefaultAccountForCurrency<T extends { currency: string; is_default?: boolean; isDefault?: boolean }>(
  accounts: T[] | null | undefined,
  currency: SupportedCurrency,
): T | undefined {
  return accounts?.find(account => (account.is_default ?? account.isDefault ?? false) && account.currency === currency);
}
