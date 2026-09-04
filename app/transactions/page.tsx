"use client";

import { useFinanceStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Filter, Download, Plus, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";

export default function TransactionsPage() {
  const { transactions, accounts, settings, deleteTransaction } = useFinanceStore();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filtered = transactions.filter(t =>
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const TypeIcon = ({ type }: { type: string }) => {
    if (type === 'income') return <ArrowDownLeft className="w-3.5 h-3.5" />;
    if (type === 'transfer') return <ArrowLeftRight className="w-3.5 h-3.5" />;
    return <ArrowUpRight className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Ledger</h1>
          <p className="text-muted-foreground mt-1 text-sm">{filtered.length} transactions</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl font-semibold hover:bg-secondary/80 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <AddTransactionDialog />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-secondary/50 border border-border/50 rounded-2xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
        />
      </div>

      {/* Mobile: Card List — hidden on lg+ */}
      <div className="flex flex-col gap-3 lg:hidden">
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">No transactions found.</div>
        )}
        {filtered.map((t, index) => {
          const account = accounts.find(a => a.id === t.accountId);
          const isIncome = t.type === 'income';
          const isTransfer = t.type === 'transfer';
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="glass rounded-2xl p-4 flex items-center gap-4 group"
            >
              {/* Type icon pill */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                isIncome ? "bg-primary/10 text-primary" :
                isTransfer ? "bg-blue-500/10 text-blue-400" :
                "bg-destructive/10 text-destructive"
              )}>
                <TypeIcon type={t.type} />
              </div>

              {/* Middle: desc + meta */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">
                  {t.description || t.category}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {account && (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: account.color }} />
                      <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">{account.name}</span>
                    </div>
                  )}
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className="text-[11px] text-muted-foreground">{formatDate(t.date)}</span>
                </div>
                <span className="mt-1 inline-block px-2 py-0.5 rounded-md bg-secondary text-[10px] font-semibold text-muted-foreground">
                  {t.category}
                </span>
              </div>

              {/* Right: amount + delete */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={cn(
                  "font-bold text-sm tabular",
                  isIncome ? "text-primary" : isTransfer ? "text-blue-400" : "text-destructive"
                )}>
                  {isIncome ? '+' : isTransfer ? '⇄' : '-'}
                  {formatCurrency(t.amount, t.currency || settings.currency)}
                </span>
                <button
                  onClick={() => { if (confirm('Delete this transaction?')) deleteTransaction(t.id); }}
                  className="p-1.5 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white"
                >
                  <Plus className="w-3 h-3 rotate-45" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Desktop: Table — hidden on mobile */}
      <div className="hidden lg:block glass rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Account</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filtered.map((t, index) => {
              const account = accounts.find(a => a.id === t.accountId);
              return (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group hover:bg-secondary/20 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm tabular text-muted-foreground">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: account?.color || 'var(--border)' }} />
                      {account?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-lg bg-secondary text-[11px] font-semibold text-muted-foreground">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{t.description}</td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold tabular",
                    t.type === 'income' ? "text-primary" : "text-destructive"
                  )}>
                    <div className="flex items-center justify-end gap-3">
                      <span>{t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount, t.currency || settings.currency)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm('Delete this transaction?')) deleteTransaction(t.id); }}
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white"
                      >
                        <Plus className="w-3 h-3 rotate-45" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">No transactions found.</div>
        )}
      </div>
    </div>
  );
}
