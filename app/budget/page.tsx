"use client";

import { useFinanceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Plus, PieChart, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AddBudgetDialog } from "@/components/add-budget-dialog";

export default function BudgetPage() {
  const { expenses, transactions, settings, setExpenses } = useFinanceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const deleteCategory = (id: string) => {
    if (confirm('Remove this budget category?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Budget Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor your spending limits across categories.</p>
        </div>
        <AddBudgetDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expenses.map((category, index) => {
          // Calculate actual spent this month for this category
          const actualSpent = transactions
            .filter(t => 
              t.type === 'expense' && 
              t.category === category.category &&
              new Date(t.date).getMonth() === thisMonth &&
              new Date(t.date).getFullYear() === thisYear
            )
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          const percent = (actualSpent / category.budgeted) * 100;
          const isOver = percent > 100;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass p-6 rounded-3xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg">{category.name}</h3>
                  <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{category.category}</div>
                </div>
                {isOver && (
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="text-2xl font-bold tabular tracking-tight">
                    {formatCurrency(actualSpent, settings.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    of {formatCurrency(category.budgeted, settings.currency)}
                  </div>
                </div>

                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, percent)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={cn(
                      "h-full rounded-full transition-colors",
                      percent > 90 ? "bg-destructive" : percent > 70 ? "bg-amber-500" : "bg-primary"
                    )}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>{Math.round(percent)}% Used</span>
                  <span>{formatCurrency(Math.max(0, category.budgeted - actualSpent), settings.currency)} left</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {expenses.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center glass rounded-3xl border-dashed">
            <PieChart className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No budget categories</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
              Set limits for your housing, food, and entertainment to take control of your cash flow.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
