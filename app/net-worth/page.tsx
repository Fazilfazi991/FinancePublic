"use client";

import { useFinanceStore } from "@/lib/store";
import { formatCurrency, formatDate, getAccountBalance } from "@/lib/utils";
import { LineChart, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function NetWorthPage() {
  const { accounts, debts, settings, rates, transactions } = useFinanceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const convert = (amount: number, fromCurrency: string) => {
    if (fromCurrency === settings.currency) return amount;
    const usdAmount = amount / (rates.rates[fromCurrency] || 1);
    return usdAmount * (rates.rates[settings.currency] || 1);
  };

  const totalAssets = accounts.reduce((sum, a) => {
    const balance = getAccountBalance(a.id, accounts, transactions, settings);
    return sum + convert(balance, a.currency);
  }, 0);
  const totalLiabilities = debts.reduce((sum, d) => sum + Number(d.balance), 0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Net Worth</h1>
        <p className="text-muted-foreground mt-1">A comprehensive view of your total wealth.</p>
      </div>

      <div className="glass p-10 rounded-[3rem] bg-primary/5 border-primary/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Current Total Wealth</div>
          <div className="text-6xl font-black tabular tracking-tighter mb-8">
            {formatCurrency(netWorth, settings.currency)}
          </div>
          <div className="flex gap-10">
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-primary" /> Assets
              </div>
              <div className="text-2xl font-bold tabular">{formatCurrency(totalAssets, settings.currency)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3 text-destructive" /> Liabilities
              </div>
              <div className="text-2xl font-bold tabular">{formatCurrency(totalLiabilities, settings.currency)}</div>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] -mr-48 -mt-48 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold mb-6">Asset Allocation</h3>
          <div className="space-y-4">
            {accounts.map(acc => {
              const currentBalance = getAccountBalance(acc.id, accounts, transactions, settings);
              const balance = convert(currentBalance, acc.currency);
              const percent = (balance / (totalAssets || 1)) * 100;
              return (
                <div key={acc.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{acc.name}</span>
                    <span className="tabular font-bold">{Math.round(percent)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: `${percent}%`, backgroundColor: acc.color }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold mb-6">Liability Breakdown</h3>
          <div className="space-y-4">
            {debts.map(debt => {
              const percent = (debt.balance / (totalLiabilities || 1)) * 100;
              return (
                <div key={debt.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{debt.name}</span>
                    <span className="tabular font-bold">{Math.round(percent)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-destructive rounded-full" 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
