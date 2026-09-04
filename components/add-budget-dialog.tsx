"use client";

import * as React from "react";
import { useFinanceStore, Expense } from "@/lib/store";
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

export function AddBudgetDialog({ children }: { children?: React.ReactNode }) {
  const { setExpenses, expenses } = useFinanceStore();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [budgeted, setBudgeted] = React.useState("");
  const [category, setCategory] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !budgeted || !category) return;

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      name,
      budgeted: parseFloat(budgeted),
      spent: 0,
      category,
    };

    setExpenses([...expenses, newExpense]);
    setOpen(false);
    // Reset
    setName("");
    setBudgeted("");
    setCategory("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Budget Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Category Name</label>
            <Input 
              placeholder="Housing, Groceries, Entertainment..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">System Category (for tracking)</label>
            <Input 
              placeholder="Food, Rent, Bills..." 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Monthly Budget Limit</label>
            <Input 
              type="number" 
              placeholder="0.00" 
              value={budgeted}
              onChange={(e) => setBudgeted(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-6 rounded-2xl shadow-lg shadow-primary/20">
              Create Budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
