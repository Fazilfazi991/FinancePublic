"use client";

import * as React from "react";
import { useFinanceStore } from "@/lib/store";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function AddGoalDialog({ children, open: controlledOpen, onOpenChange }: { children?: React.ReactNode; open?: boolean; onOpenChange?: (open:boolean)=>void }) {
  const { addGoal } = useFinanceStore();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [name, setName] = React.useState("");
  const [target, setTarget] = React.useState("0");
  const [saved, setSaved] = React.useState("0");
  const [deadline, setDeadline] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newGoal = {
      id: crypto.randomUUID(),
      name,
      target: parseFloat(target) || 0,
      saved: parseFloat(saved) || 0,
      deadline: deadline || undefined,
      description,
      category,
      manualProgress: parseFloat(target) === 0 ? 0 : undefined,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      notes: "",
      currentMilestone: 0,
      totalMilestones: 0,
      milestoneValue: 0
    };

    addGoal(newGoal);
    setOpen(false);
    // Reset
    setName("");
    setTarget("0");
    setSaved("0");
    setDeadline("");
    setDescription("");
    setCategory("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>
        {children || (
          <Button className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> New Goal
          </Button>
        )}
      </DialogTrigger>}
      <DialogContent className="sm:max-w-[425px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Goal Name</label>
            <Input 
              placeholder="Dream House, New Car..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Category</label>
            <Input 
              placeholder="Personal, Company..." 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Description</label>
            <Input 
              placeholder="Brief description..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Target Amount</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl"
              />
              <p className="text-[9px] text-muted-foreground italic">Use 0 for milestone goals</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Already Saved</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={saved}
                onChange={(e) => setSaved(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Target Deadline (Optional)</label>
            <Input 
              type="date" 
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-purple-600 text-white font-bold py-6 rounded-2xl shadow-lg shadow-purple-600/20">
              Set Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
