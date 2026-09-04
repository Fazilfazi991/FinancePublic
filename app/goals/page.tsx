"use client";

import { useFinanceStore, Goal } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Plus, Target, Trophy, Clock, Edit2, Check, X, Tag, FileText, Pencil, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { AddGoalDialog } from "@/components/add-goal-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface InlineEditProps {
  value: string | number;
  onSave: (val: any) => Promise<void>;
  type?: 'text' | 'number' | 'date' | 'textarea';
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
            className={cn("bg-secondary/50 min-h-[80px]", className)}
          />
        ) : (
          <Input
            type={type}
            autoFocus
            value={currentValue}
            onChange={(e) => setCurrentValue(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={cn("bg-secondary/50", className)}
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

export default function GoalsPage() {
  const { goals, updateGoal, deleteGoal } = useFinanceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [goals]);

  if (!mounted) return null;

  const handleUpdate = async (id: string, data: Partial<Goal>) => {
    try {
      await updateGoal(id, { ...data, lastUpdated: new Date().toISOString() });
    } catch (e) {
      throw e;
    }
  };

  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(deadline);
    targetDate.setHours(0, 0, 0, 0);
    const diff = targetDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatus = (goal: Goal) => {
    if (goal.target === 0) return null;
    const today = new Date().getTime();
    const start = new Date(goal.createdAt).getTime();
    const end = new Date(goal.deadline || '').getTime();
    
    if (today >= end) return { label: 'Overdue', color: 'bg-destructive/20 text-destructive' };
    
    const totalDays = end - start;
    const daysPassed = today - start;
    const expectedProgress = (daysPassed / totalDays) * 100;
    const actualProgress = (goal.saved / goal.target) * 100;
    
    const diff = actualProgress - expectedProgress;
    
    if (diff > 10) return { label: 'Ahead', color: 'bg-purple-500/20 text-purple-400' };
    if (diff >= 0) return { label: 'On track', color: 'bg-emerald-500/20 text-emerald-400' };
    if (diff > -10) return { label: 'Slightly behind', color: 'bg-amber-500/20 text-amber-400' };
    return { label: 'Behind', color: 'bg-destructive/20 text-destructive' };
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Goals & Dreams</h1>
          <p className="text-muted-foreground mt-1">Track what you&apos;re working toward.</p>
        </div>
        <AddGoalDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedGoals.map((goal, index) => {
          const isMilestone = goal.target === 0;
          const progress = isMilestone ? (goal.manualProgress || 0) : (goal.saved / goal.target) * 100;
          const isCompleted = progress >= 100;
          
          const daysLeft = goal.deadline ? getDaysLeft(goal.deadline) : null;
          const status = getStatus(goal);
          const dailyTarget = !isCompleted && daysLeft && daysLeft > 0 && !isMilestone 
            ? Math.round((goal.target - goal.saved) / daysLeft) 
            : null;

          const lastUpdatedDays = goal.lastUpdated 
            ? Math.floor((new Date().getTime() - new Date(goal.lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <motion.div
              key={goal.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-8 rounded-[2.5rem] relative group border border-white/5 flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  isCompleted ? "bg-primary/10 text-primary" : "bg-purple-500/10 text-purple-500"
                )}>
                  {isCompleted ? <Trophy className="w-7 h-7" /> : <Target className="w-7 h-7" />}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {goal.deadline && (
                      <InlineEdit
                        type="date"
                        value={goal.deadline}
                        onSave={(val) => handleUpdate(goal.id, { deadline: val })}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                          daysLeft !== null && daysLeft < 7 ? "bg-destructive/20 text-destructive" :
                          daysLeft !== null && daysLeft <= 14 ? "bg-amber-500/20 text-amber-500" :
                          "bg-secondary text-muted-foreground"
                        )}
                        prefix={daysLeft !== null ? (daysLeft < 0 ? "Overdue — " : `${daysLeft} days left — `) : ""}
                      />
                    )}
                    <button 
                      onClick={() => { if(confirm('Delete this goal?')) deleteGoal(goal.id) }}
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white"
                    >
                      <Plus className="w-3 h-3 rotate-45" />
                    </button>
                  </div>
                  {goal.category && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 rounded-full text-[10px] font-bold text-purple-400 uppercase">
                      <Tag className="w-3 h-3" />
                      {goal.category}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <InlineEdit 
                  value={goal.name} 
                  onSave={(val) => handleUpdate(goal.id, { name: val })}
                  className="text-xl font-bold"
                />
                <InlineEdit 
                  type="textarea"
                  value={goal.description || ""} 
                  onSave={(val) => handleUpdate(goal.id, { description: val })}
                  className="text-sm text-muted-foreground leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tabular tracking-tighter">
                    {Math.round(progress)}%
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px]">complete</span>
                    {status && (
                      <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase mt-1", status.color)}>
                        {status.label}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Visual */}
              <div className="space-y-2 mb-8">
                <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progress)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      isCompleted ? "bg-primary" : "bg-purple-500"
                    )}
                  />
                </div>
                {dailyTarget && (
                  <div className="text-[10px] text-muted-foreground font-medium italic">
                    {formatCurrency(dailyTarget, 'INR')} / day needed to hit target
                  </div>
                )}
              </div>

              {/* Milestone Tracker */}
              {goal.totalMilestones && goal.totalMilestones > 0 && (
                <div className="mb-8 p-4 bg-secondary/30 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Milestones</div>
                    <div className="text-xs font-bold text-primary">{goal.currentMilestone} / {goal.totalMilestones} done</div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: goal.totalMilestones }).map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          i < (goal.currentMilestone || 0) ? "bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-secondary"
                        )}
                      />
                    ))}
                  </div>
                  {!isCompleted && (
                    <button 
                      onClick={() => {
                        const newMs = (goal.currentMilestone || 0) + 1;
                        const newSaved = goal.saved + (goal.milestoneValue || 0);
                        handleUpdate(goal.id, { currentMilestone: newMs, saved: newSaved });
                      }}
                      className="w-full py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Increment Milestone
                    </button>
                  )}
                </div>
              )}

              <div className="flex justify-between items-end gap-4 mb-8">
                <div className="space-y-2 flex-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {isMilestone ? "Manual Progress" : "Saved So Far"}
                  </div>
                  <InlineEdit
                    type="number"
                    value={isMilestone ? (goal.manualProgress || 0) : goal.saved}
                    onSave={(val) => handleUpdate(goal.id, isMilestone ? { manualProgress: val } : { saved: val })}
                    className="text-lg font-bold tabular"
                    prefix={isMilestone ? "" : "₹"}
                  />
                </div>
                {!isMilestone && (
                  <div className="text-right space-y-2">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target</div>
                    <div className="text-lg font-bold tabular text-muted-foreground">
                      {formatCurrency(goal.target, 'INR')}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <InlineEdit
                    value={goal.notes || ""}
                    onSave={(val) => handleUpdate(goal.id, { notes: val })}
                    className="text-xs text-muted-foreground flex-1"
                    label="Add a note..."
                  />
                </div>
                {lastUpdatedDays !== null && (
                  <div className={cn(
                    "text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                    lastUpdatedDays >= 7 ? "text-amber-500" : "text-muted-foreground/50"
                  )}>
                    <div className={cn("w-1 h-1 rounded-full", lastUpdatedDays >= 7 ? "bg-amber-500 animate-pulse" : "bg-muted-foreground/30")} />
                    Updated {lastUpdatedDays === 0 ? "today" : `${lastUpdatedDays} days ago`}
                    {lastUpdatedDays >= 7 && " — Log your progress"}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center glass rounded-[2.5rem] border-dashed border-white/10">
            <Target className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">What are you working toward?</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
              Add your new goals to start tracking your journey.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
