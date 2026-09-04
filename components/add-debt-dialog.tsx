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

export function AddDebtDialog({ children }: { children?: React.ReactNode }) {
  const { addDebt, debts } = useFinanceStore();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [balance, setBalance] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [minPayment, setMinPayment] = React.useState("");
  const [total, setTotal] = React.useState("");
  const [color, setColor] = React.useState("#E24B4A");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !balance || !rate || !minPayment || !total) return;

    addDebt({
      id: crypto.randomUUID(),
      name,
      balance: parseFloat(balance),
      rate: parseFloat(rate),
      minPayment: parseFloat(minPayment),
      total: parseFloat(total),
      color,
      notes: ""
    });

    setOpen(false);
    // Reset
    setName("");
    setBalance("");
    setRate("");
    setMinPayment("");
    setTotal("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Add Debt
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New Liability</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Debt Name</label>
            <Input 
              placeholder="Credit Card, Student Loan..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Current Balance</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Original Total</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Interest Rate (%)</label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00" 
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Min. Monthly Payment</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Theme Color</label>
            <Input 
              type="color" 
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl h-10 p-1"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-destructive text-white font-bold py-6 rounded-2xl shadow-lg shadow-destructive/20">
              Save Liability
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
