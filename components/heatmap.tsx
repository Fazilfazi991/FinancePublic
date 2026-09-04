"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapProps {
  data: Record<string, number>; // date string "YYYY-MM-DD" -> amount
  className?: string;
}

export function Heatmap({ data, className }: HeatmapProps) {
  const today = new Date();
  const weeks = 52;
  const days = 7;
  
  const cells = [];
  const startDate = new Date();
  startDate.setDate(today.getDate() - (weeks * days));
  
  // Find the first Sunday to start the grid
  while (startDate.getDay() !== 0) {
    startDate.setDate(startDate.getDate() - 1);
  }

  for (let w = 0; w < weeks; w++) {
    const weekCells = [];
    for (let d = 0; d < days; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + (w * days) + d);
      const dateString = date.toISOString().split('T')[0];
      const amount = data[dateString] || 0;
      
      // Determine intensity
      let intensity = 0;
      if (amount > 0) intensity = 1;
      if (amount > 500) intensity = 2;
      if (amount > 1000) intensity = 3;
      if (amount > 5000) intensity = 4;
      
      weekCells.push({ date, dateString, amount, intensity });
    }
    cells.push(weekCells);
  }

  const intensityColors = [
    "bg-secondary/30",
    "bg-primary/20",
    "bg-primary/40",
    "bg-primary/70",
    "bg-primary"
  ];

  return (
    <div className={cn("overflow-x-auto p-4 scrollbar-none", className)}>
      <div className="flex gap-1.5 min-w-max">
        {cells.map((week, w) => (
          <div key={w} className="flex flex-col gap-1.5">
            {week.map((day, d) => (
              <TooltipProvider key={day.dateString}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: (w * 0.01) + (d * 0.005) }}
                      className={cn(
                        "w-3 h-3 rounded-[2px] transition-all duration-300 hover:ring-2 hover:ring-foreground/20 cursor-pointer",
                        intensityColors[day.intensity]
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-popover/80 backdrop-blur-md">
                    <div className="text-xs">
                      <div className="font-bold">{day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-muted-foreground">{day.amount > 0 ? `Income: ${day.amount}` : 'No activity'}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
