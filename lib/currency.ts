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

type QuickEntryAccount = {
  currency: string;
  type?: string;
  is_default?: boolean;
  isDefault?: boolean;
};

export type QuickEntryAccountResolution<T> =
  | { status: 'none'; account: null; eligible: T[] }
  | { status: 'selected'; account: T; eligible: T[] }
  | { status: 'needs_default'; account: null; eligible: T[] };

export function resolveQuickEntryAccount<T extends QuickEntryAccount>(
  accounts: T[] | null | undefined,
  currency: SupportedCurrency,
): QuickEntryAccountResolution<T> {
  const eligible = (accounts ?? []).filter(account =>
    account.currency === currency && account.type !== 'credit' && account.type !== 'receivable',
  );
  if (eligible.length === 0) return { status: 'none', account: null, eligible };
  if (eligible.length === 1) return { status: 'selected', account: eligible[0], eligible };
  const defaultAccount = eligible.find(account => account.is_default ?? account.isDefault ?? false);
  return defaultAccount
    ? { status: 'selected', account: defaultAccount, eligible }
    : { status: 'needs_default', account: null, eligible };
}
