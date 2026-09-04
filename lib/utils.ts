import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'INR') {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function toAED(inr: number) {
  return (inr / 25).toFixed(0);
}

export function fmtAED(aed: number | string) {
  return `AED ${Number(aed).toLocaleString('en-AE')}`;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export const calculatePercentage = (value: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

export const getAccountBalance = (accId: string, accounts: any[], transactions: any[], settings: any) => {
  const acc = accounts.find((a: any) => a.id === accId);
  if (!acc) return 0;
  const txns = transactions.filter((t: any) => t.accountId === accId || t.toAccountId === accId);
  let balance = Number(acc.openingBalance || 0);
  txns.forEach((t: any) => {
    let amt = Number(t.amount);
    
    // Convert transaction amount to account currency if they differ
    if (t.currency && t.currency !== acc.currency) {
      if (t.currency === 'INR' && acc.currency === 'AED') {
        amt = amt / settings.aedToInr;
      } else if (t.currency === 'AED' && acc.currency === 'INR') {
        amt = amt * settings.aedToInr;
      }
    }

    if (t.type === 'income' && t.accountId === accId) balance += amt;
    else if (t.type === 'expense' && t.accountId === accId) balance -= amt;
    else if (t.type === 'transfer') {
      if (t.accountId === accId) balance -= amt;
      if (t.toAccountId === accId) balance += amt;
    }
  });
  return balance;
};
