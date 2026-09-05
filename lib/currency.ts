export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'AED', 'EUR'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
export type CurrencyProfile = { base_currency?: unknown } | null | undefined;

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === 'string' && SUPPORTED_CURRENCIES.includes(value.trim().toUpperCase() as SupportedCurrency);
}

export function hasValidBaseCurrency(profile: CurrencyProfile): boolean {
  return isSupportedCurrency(profile?.base_currency);
}
