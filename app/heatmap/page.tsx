"use client";

import { useEffect, useState } from "react";
import { useFinanceStore } from "@/lib/store";
import { Heatmap } from "@/components/heatmap";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function HeatmapPage() {
  const { transactions, settings } = useFinanceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Process transactions into daily amounts
  const heatmapData: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.type === 'income') {
      const date = t.date;
      heatmapData[date] = (heatmapData[date] || 0) + Number(t.amount);
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Income Heatmap</h1>
        <p className="text-muted-foreground mt-1">Visualize your earning consistency over the last year.</p>
      </div>

      <div className="glass p-8 rounded-3xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">52-Week Activity</div>
            <div className="flex items-center gap-1.5 ml-4">
              <span className="text-[10px] text-muted-foreground">Less</span>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className={cn(
                  "w-3 h-3 rounded-[2px]",
                  i === 0 ? "bg-secondary/30" : i === 1 ? "bg-primary/20" : i === 2 ? "bg-primary/40" : i === 3 ? "bg-primary/70" : "bg-primary"
                )} />
              ))}
              <span className="text-[10px] text-muted-foreground ml-1">More</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Current Streak: <span className="font-bold text-foreground">0 days</span>
          </div>
        </div>

        <Heatmap data={heatmapData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Best Day</div>
          <div className="text-2xl font-bold tracking-tight">$0</div>
        </div>
        <div className="glass p-6 rounded-3xl">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Average Daily</div>
          <div className="text-2xl font-bold tracking-tight">$0</div>
        </div>
        <div className="glass p-6 rounded-3xl">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Active Days</div>
          <div className="text-2xl font-bold tracking-tight">0</div>
        </div>
      </div>
    </div>
  );
}
