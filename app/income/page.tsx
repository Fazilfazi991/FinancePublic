"use client";

import { useFinanceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Briefcase, 
  Code, 
  Megaphone, 
  Plus, 
  ArrowUpRight, 
  TrendingUp, 
  ShieldCheck,
  PlusCircle,
  HelpCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";

const ICON_MAP: Record<string, any> = {
  briefcase: Briefcase,
  code: Code,
  megaphone: Megaphone,
  plus: Plus
};

export default function IncomePage() {
  const { incomes, transactions, settings } = useFinanceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Calculate actuals per stream
  const streamsWithActuals = incomes.map(stream => {
    const actual = transactions
      .filter(t => t.type === 'income' && t.incomeStreamId === stream.id)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { ...stream, actualThisMonth: actual };
  });

  const totalActual = streamsWithActuals.reduce((sum, s) => sum + s.actualThisMonth, 0);

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Income Streams</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            You have 4 active income streams. Multiple streams = financial resilience.
          </p>
        </div>
        
        <div className="glass px-8 py-4 rounded-3xl text-right">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Total This Month</div>
          <div className="text-2xl font-bold tabular">
            {formatCurrency(totalActual, 'INR')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {streamsWithActuals.map((stream, index) => {
          if (stream.status === 'coming_soon') return null;
          
          const Icon = ICON_MAP[stream.icon] || Briefcase;
          const variance = stream.actualThisMonth - stream.expectedMonthly;
          const isHealthy = stream.actualThisMonth >= stream.expectedMonthly || stream.expectedMonthly === 0;

          return (
            <motion.div
              key={stream.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-8 rounded-[2.5rem] relative group overflow-hidden border-l-4"
              style={{ borderLeftColor: stream.color }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${stream.color}15`, color: stream.color }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xl">{stream.name}</h3>
                      <span className="px-2 py-0.5 bg-secondary text-[10px] font-bold rounded uppercase tracking-wider">
                        {stream.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{stream.notes}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    Expected <HelpCircle className="w-3 h-3 opacity-50" />
                  </div>
                  <div className="text-2xl font-black tabular">
                    {formatCurrency(stream.expectedMonthly, 'INR')}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actual</div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-black tabular">
                      {formatCurrency(stream.actualThisMonth, 'INR')}
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter",
                      isHealthy ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                    )}>
                      {variance >= 0 ? `+${variance}` : variance}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <AddTransactionDialog initialType="income" initialStreamId={stream.id}>
                  <button className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20">
                    <PlusCircle className="w-5 h-5" />
                    Log Income
                  </button>
                </AddTransactionDialog>
                <button className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center hover:bg-secondary/80 transition-all">
                  <ArrowUpRight className="w-6 h-6" />
                </button>
              </div>

              {stream.actualThisMonth === 0 && (
                <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <p className="text-xs font-bold text-foreground bg-background px-4 py-2 rounded-full border border-border shadow-xl">
                    No income logged yet — tap to add your first entry
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Coming Soon Card */}
        {incomes.filter(s => s.status === 'coming_soon').map(stream => (
          <motion.div
            key={stream.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border-dashed border-2 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-primary/5 transition-all min-h-[300px]"
          >
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-muted-foreground">More income streams</h3>
            <p className="text-sm text-muted-foreground/60 mt-1">Tap + to add a new income source</p>
          </motion.div>
        ))}
      </div>

      <div className="pt-8 border-t border-white/5 flex justify-center">
        <button className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-all">
          Track project-by-project income <TrendingUp className="w-4 h-4" /> Go to Pipeline
        </button>
      </div>
    </div>
  );
}
