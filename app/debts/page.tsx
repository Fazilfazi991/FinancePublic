"use client";
import Link from "next/link";

import { useFinanceStore, Debt } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Plus, TrendingDown, Info, HelpCircle, Pencil, AlertCircle, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AddDebtDialog } from "@/components/add-debt-dialog";
import { EditDebtDialog } from "@/components/edit-debt-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface InlineEditProps {
  value: string | number;
  onSave: (val: any) => Promise<void>;
  type?: 'text' | 'number' | 'textarea';
  className?: string;
  label?: string;
  prefix?: string;
}

function InlineEdit({ value, onSave, type = 'text', className, label, prefix }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (currentValue === value) {
      setIsEditing(false);
      return;
    }
    try {
      await onSave(currentValue);
      setStatus('success');
      setTimeout(() => setStatus(null), 200);
      setIsEditing(false);
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Failed to save');
      setTimeout(() => setStatus(null), 200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') handleSave();
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="w-full space-y-1">
        {type === 'textarea' ? (
          <Textarea
            autoFocus
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={cn("bg-secondary/50 min-h-[60px] text-xs", className)}
          />
        ) : (
          <Input
            type={type}
            autoFocus
            value={currentValue}
            onChange={(e) => setCurrentValue(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={cn("bg-secondary/50 h-8", className)}
          />
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={cn(
        "group/edit relative cursor-pointer rounded-lg transition-all duration-200 border border-transparent",
        status === 'success' && "border-emerald-500/50 bg-emerald-500/5",
        status === 'error' && "border-destructive/50 bg-destructive/5",
        !status && "hover:bg-white/5",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="truncate">
          {prefix}{type === 'number' && typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        <Pencil className="w-3 h-3 opacity-0 group-hover/edit:opacity-50 transition-opacity" />
      </div>
      {error && status === 'error' && (
        <div className="absolute top-full left-0 mt-1 text-[10px] text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}
    </div>
  );
}

export default function DebtsPage() {
  const { debts, settings, deleteDebt, updateDebt } = useFinanceStore();
  const [mounted, setMounted] = useState(false);
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpdate = async (id: string, data: Partial<Debt>) => {
    try {
      await updateDebt(id, data);
    } catch (e) {
      throw e;
    }
  };

  if (!mounted) return null;

  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'snowball') return a.balance - b.balance;
    return b.rate - a.rate;
  });

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.balance), 0);
  const currencyPrefix = settings.currency === 'USD' ? '$' : settings.currency === 'AED' ? 'AED ' : '₹';

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Debt Command Center</h1>
          <p className="text-muted-foreground mt-1">{formatCurrency(totalDebt, settings.currency)} to go. You&apos;ve got this.</p>
        </div>
        <AddDebtDialog />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {sortedDebts.map((debt, index) => {
            return (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass p-6 rounded-3xl relative group overflow-hidden border-l-4"
                style={{ borderLeftColor: debt.color }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-secondary shrink-0">
                      <TrendingDown className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/debts/${debt.id}`} className="text-lg font-bold hover:text-primary">{debt.name}</Link>
                      </div>
                      <InlineEdit
                        type="textarea"
                        value={debt.notes || ""}
                        onSave={(val) => handleUpdate(debt.id, { notes: val })}
                        className="text-xs text-muted-foreground"
                        label="Add notes..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end shrink-0">
                    <div className="text-2xl font-bold tabular">
                      <InlineEdit
                        type="number"
                        value={debt.balance}
                        onSave={(val) => handleUpdate(debt.id, { balance: val, total: Math.max(debt.total, val) })}
                        className="text-2xl font-bold tabular"
                        prefix={currencyPrefix}
                      />
                    </div>
                  </div>

                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all flex items-center">
                    <EditDebtDialog debt={debt}>
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </EditDebtDialog>
                    <button 
                      onClick={() => { if(confirm(`Delete debt to ${debt.name}?`)) deleteDebt(debt.id) }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="space-y-6">
          <div className="glass p-8 rounded-[2.5rem] border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Snowball Order
              </h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs glass p-4">
                    <p className="text-xs leading-relaxed">
                      The <strong>Snowball Method</strong> recommends paying off the smallest balances first to build psychological momentum and clear individual debts faster.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="space-y-4">
              {[...debts].sort((a, b) => a.balance - b.balance).map((debt, i) => (
                <div key={debt.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className={cn("text-sm font-medium truncate max-w-[120px]", i === 0 ? "text-foreground" : "text-muted-foreground")}>
                      {debt.name}
                    </span>
                    <span className="text-[10px] font-bold tabular text-muted-foreground">
                      {formatCurrency(debt.balance, settings.currency)}
                    </span>
                  </div>
                  {i === 0 && <span className="text-[9px] font-bold text-primary uppercase tracking-tighter shrink-0">Start Here</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem]">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-muted-foreground" /> Insight
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Prioritize high-interest balances while maintaining every minimum payment.
              </p>
              <p className="text-xs">
                Paying <span className="text-foreground font-bold">{formatCurrency(totalDebt / 24, settings.currency)}</span> of principal monthly would cover the current balance in 24 months, before interest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
