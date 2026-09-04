"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: {
    value: number;
    color: string;
  };
  className?: string;
}

export function MetricCard({ 
  label, 
  value, 
  subtitle, 
  trend, 
  progress, 
  className 
}: MetricCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("glass p-6 rounded-3xl group", className)}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-baseline gap-3">
          <h2 className="text-3xl font-bold tabular tracking-tight">
            {value}
          </h2>
          {trend && (
            <span className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              trend.isPositive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            )}>
              {trend.isPositive ? "+" : "-"}{trend.value}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {progress && (
        <div className="mt-4 h-1 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress.value}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: progress.color }}
          />
        </div>
      )}
    </motion.div>
  );
}
