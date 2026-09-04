"use client";

import { useFinanceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { LineChart, TrendingUp, Calendar, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function ForecastPage() {
  const { accounts, transactions, debts, settings } = useFinanceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Simple linear projection based on last 30 days cash flow
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  const recentIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date) > last30Days)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const recentExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.date) > last30Days)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const dailyCashFlow = (recentIncome - recentExpenses) / 30;
  
  const currentNetWorth = accounts.reduce((sum, a) => sum + Number(a.openingBalance), 0) - debts.reduce((sum, d) => sum + Number(d.balance), 0);

  const forecast = [6, 12, 24, 60].map(months => {
    const projectedValue = currentNetWorth + (dailyCashFlow * 30 * months);
    return { months, value: projectedValue };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Wealth Forecast</h1>
        <p className="text-muted-foreground mt-1">Projected net worth based on your current spending habits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-primary" />
            Projected Growth
          </h3>
          <div className="space-y-10">
            {forecast.map((f, i) => (
              <div key={f.months} className="relative">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{f.months} Months</div>
                    <div className="text-2xl font-bold tabular tracking-tight">
                      {formatCurrency(f.value, settings.currency)}
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs font-bold px-2 py-1 rounded-lg",
                    f.value > currentNetWorth ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                  )}>
                    {f.value > currentNetWorth ? "+" : ""}{Math.round(((f.value - currentNetWorth) / (currentNetWorth || 1)) * 100)}%
                  </div>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, 30 + (i * 20))}%` }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-8 rounded-[2.5rem] bg-primary/5 border-primary/20">
            <h4 className="font-bold flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              Insights
            </h4>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                At your current savings rate of <span className="text-foreground font-bold">{formatCurrency(dailyCashFlow * 30, settings.currency)}/mo</span>, you are building wealth.
              </p>
              <p>
                You are on track to increase your net worth by <span className="text-foreground font-bold">{Math.round(((forecast[3].value - currentNetWorth) / (currentNetWorth || 1)) * 100)}%</span> in 5 years.
              </p>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem]">
            <h4 className="font-bold flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-muted-foreground" />
              Assumptions
            </h4>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                Constant monthly income/expense based on last 30 days.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                No investment returns or inflation accounted for.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
