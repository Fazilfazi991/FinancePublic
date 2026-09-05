"use client";

import * as React from "react";
import { useFinanceStore, Account } from "@/lib/store";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface AccountDialogProps {
  children?: React.ReactNode;
  account?: Account;
}

export function AccountDialog({ children, account }: AccountDialogProps) {
  const { addAccount, updateAccount, rates, settings } = useFinanceStore();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(account?.name || "");
  const [institution, setInstitution] = React.useState(account?.institution || "");
  const [type, setType] = React.useState(account?.type || "savings");
  const [currency, setCurrency] = React.useState(account?.currency || settings.currency || "INR");
  const [balance, setBalance] = React.useState(account?.openingBalance?.toString() || "");
  const [color, setColor] = React.useState(account?.color || "#10b981");
  const [isDefault, setIsDefault] = React.useState(account?.isDefault || false);

  React.useEffect(() => {
    if (account) {
      setName(account.name);
      setInstitution(account.institution);
      setType(account.type);
      setCurrency(account.currency);
      setBalance(account.openingBalance.toString());
      setColor(account.color);
      setIsDefault(Boolean(account.isDefault));
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !institution || !balance) return;

    if (account) {
      updateAccount(account.id, {
        name,
        institution,
        type,
        currency,
        openingBalance: parseFloat(balance),
        color,
        isDefault,
      });
    } else {
      addAccount({
        id: crypto.randomUUID(),
        name,
        institution,
        type,
        currency,
        openingBalance: parseFloat(balance),
        color,
        createdAt: new Date().toISOString(),
        isDefault,
      });
    }

    setOpen(false);
    if (!account) {
      setName("");
      setInstitution("");
      setBalance("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Add Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{account ? "Edit Account" : "New Account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Bank/Inst.</label>
              <Input 
                placeholder="HDFC, Chase..." 
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Name</label>
              <Input 
                placeholder="Savings, Cash..." 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl"
                required
              />
            </div>
          </div>

          <label className="flex min-h-12 items-center gap-3 rounded-xl bg-secondary/50 px-4 text-sm font-medium">
            <input type="checkbox" checked={isDefault} onChange={event => setIsDefault(event.target.checked)} className="h-5 w-5 accent-primary" />
            Use as my default account for Quick Entry
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Type</label>
              <Select onValueChange={(val: any) => setType(val)} defaultValue={type}>
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Currency</label>
              <Select onValueChange={(val: any) => setCurrency(val)} defaultValue={currency}>
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(rates?.rates || {}).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Opening Balance</label>
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
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Theme Color</label>
              <Input 
                type="color" 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl h-10 p-1"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-6 rounded-2xl shadow-lg shadow-primary/20">
              {account ? "Update Account" : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
