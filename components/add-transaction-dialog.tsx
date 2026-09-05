"use client";

import * as React from "react";
import { useFinanceStore } from "@/lib/store";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

const EXPENSE_CATEGORIES = [
  { value: "Housing", label: "🏠 Housing" },
  { value: "Food & Dining", label: "🍔 Food & Dining" },
  { value: "Transport", label: "🚗 Transport" },
  { value: "Utilities", label: "💡 Utilities" },
  { value: "Health", label: "🏥 Health" },
  { value: "Shopping", label: "🛍️ Shopping" },
  { value: "Entertainment", label: "🎬 Entertainment" },
  { value: "Debt Payment", label: "💳 Debt Payment" },
  { value: "Savings / Goal", label: "🎯 Savings / Goal" },
  { value: "Travel", label: "✈️ Travel" },
  { value: "Education", label: "📚 Education" },
  { value: "Personal Care", label: "👤 Personal Care" },
  { value: "Other", label: "📦 Other" },
];

const INCOME_CATEGORIES = [
  { value: "Salary", label: "💼 Salary" },
  { value: "Freelance", label: "💻 Freelance" },
  { value: "Business", label: "💼 Business" },
  { value: "Investments", label: "📈 Investments" },
  { value: "Other Income", label: "🏦 Other Income" },
];

interface AddTransactionDialogProps {
  children?: React.ReactNode;
  initialType?: 'income' | 'expense' | 'transfer';
  initialStreamId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddTransactionDialog({ 
  children, 
  initialType = 'expense',
  initialStreamId = "",
  open: controlledOpen,
  onOpenChange,
}: AddTransactionDialogProps) {
  const { accounts, incomes, debts, goals, addTransaction, updateDebt, updateGoal, settings } = useFinanceStore();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [type, setType] = React.useState<'income' | 'expense' | 'transfer'>(initialType);
  const [amount, setAmount] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [toAccountId, setToAccountId] = React.useState("");
  const [incomeStreamId, setIncomeStreamId] = React.useState(initialStreamId);
  const [category, setCategory] = React.useState("");
  const [linkedDebtId, setLinkedDebtId] = React.useState("");
  const [linkedGoalId, setLinkedGoalId] = React.useState("");
  const [currency, setCurrency] = React.useState('INR');
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);

  // Sync with props when dialog opens
  React.useEffect(() => {
    if (open) {
      setType(initialType);
      setIncomeStreamId(initialStreamId);
      setCategory("");
      setLinkedDebtId("");
      setLinkedGoalId("");
      
      if (initialStreamId) {
        const stream = incomes.find(s => s.id === initialStreamId);
        if (stream) {
          if (stream.linkedAccountId) {
            setAccountId(stream.linkedAccountId);
            const acc = accounts.find(a => a.id === stream.linkedAccountId);
            if (acc) setCurrency(acc.currency);
          }
          setCategory(stream.type === 'Business' ? 'Business' : stream.type);
          setDescription(`Income from ${stream.name}`);
        }
      } else {
        const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
        if (defaultAcc) {
          setAccountId(defaultAcc.id);
          setCurrency(defaultAcc.currency);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialType, initialStreamId]);

  // Update currency when account changes
  React.useEffect(() => {
    const acc = accounts.find(a => a.id === accountId);
    if (acc) setCurrency(acc.currency);
  }, [accountId, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) return;
    if (type !== 'transfer' && !category) return;

    const parsedAmount = parseFloat(amount);

    // Build the transaction
    const txn = {
      id: crypto.randomUUID(),
      type,
      amount: parsedAmount,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      incomeStreamId: type === 'income' ? incomeStreamId : undefined,
      category: type === 'transfer' ? 'Transfer' : category,
      description,
      date,
      currency,
      createdAt: new Date().toISOString()
    };

    addTransaction(txn);

    // If Debt Payment → reduce debt balance
    if (category === 'Debt Payment' && linkedDebtId) {
      const debt = debts.find(d => d.id === linkedDebtId);
      if (debt) {
        const newBalance = Math.max(0, debt.balance - parsedAmount);
        updateDebt(linkedDebtId, { balance: newBalance });
      }
    }

    // If Savings / Goal → increase goal saved
    if (category === 'Savings / Goal' && linkedGoalId) {
      const goal = goals.find(g => g.id === linkedGoalId);
      if (goal) {
        updateGoal(linkedGoalId, { saved: goal.saved + parsedAmount });
      }
    }

    // Reset and close
    setOpen(false);
    setAmount("");
    setDescription("");
    setCategory("");
    setLinkedDebtId("");
    setLinkedGoalId("");
  };

  const activeIncomes = incomes.filter(s => s.status === 'active');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>
        {children || (
          <Button className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
        )}
      </DialogTrigger>}
      <DialogContent className="finance-sheet max-h-[92dvh] overflow-y-auto border-border bg-card sm:max-w-[460px] sm:rounded-2xl max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl [&_input]:text-base">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Type tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-secondary rounded-xl">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategory(""); setLinkedDebtId(""); setLinkedGoalId(""); }}
                className={`py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  type === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t === 'expense' ? '💸 Expense' : t === 'income' ? '💰 Income' : '🔄 Transfer'}
              </button>
            ))}
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="col-span-3 space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Amount</label>
              <Input 
                type="number" inputMode="decimal" placeholder="0.00" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary/50 border-border/50 rounded-xl py-6 text-lg font-bold"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Currency</label>
              <Select value={currency} onValueChange={(val) => setCurrency(val)}>
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl py-6 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">₹ INR</SelectItem>
                  <SelectItem value="AED">د.إ AED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Wallets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                {type === 'transfer' ? 'From Wallet' : 'Wallet / Account'}
              </label>
              <Select value={accountId} onValueChange={(val: any) => setAccountId(val)}>
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                  <SelectValue placeholder="Select wallet..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.type !== 'receivable').map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === 'transfer' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">To Wallet</label>
                <Select value={toAccountId} onValueChange={(val: any) => setToAccountId(val)}>
                  <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                    <SelectValue placeholder="Select destination..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => a.id !== accountId && a.type !== 'receivable').map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Category</label>
                <Select value={category} onValueChange={(val: any) => { setCategory(val); setLinkedDebtId(""); setLinkedGoalId(""); }}>
                  <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                    <SelectValue placeholder="Category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Special Conditionals */}
          {type === 'income' && category && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Income Stream</label>
              <Select value={incomeStreamId} onValueChange={(val) => {
                setIncomeStreamId(val);
                const stream = incomes.find(s => s.id === val);
                if (stream && stream.linkedAccountId) setAccountId(stream.linkedAccountId);
              }}>
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                  <SelectValue placeholder="Link to income stream..." />
                </SelectTrigger>
                <SelectContent>
                  {activeIncomes.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {category === 'Debt Payment' && (
            <div className="space-y-2 p-3 bg-destructive/5 border border-destructive/20 rounded-2xl">
              <label className="text-[10px] font-bold text-destructive uppercase tracking-widest ml-1">
                💳 Which debt are you paying?
              </label>
              <Select value={linkedDebtId} onValueChange={(val: any) => setLinkedDebtId(val)}>
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                  <SelectValue placeholder="Select debt..." />
                </SelectTrigger>
                <SelectContent>
                  {debts.filter(d => d.balance > 0).map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name} — ₹{d.balance.toLocaleString('en-IN')}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {linkedDebtId && amount && (
                <div className="text-[11px] text-primary font-bold mt-2 flex items-center gap-1">
                  ✓ Will reduce {debts.find(d => d.id === linkedDebtId)?.name}&apos;s balance by ₹{parseFloat(amount).toLocaleString('en-IN')}
                </div>
              )}
            </div>
          )}

          {category === 'Savings / Goal' && (
            <div className="space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-2xl">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">
                🎯 Which goal are you saving for?
              </label>
              <Select value={linkedGoalId} onValueChange={(val: any) => setLinkedGoalId(val)}>
                <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                  <SelectValue placeholder="Select goal..." />
                </SelectTrigger>
                <SelectContent>
                  {goals.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      🎯 {g.name} — ₹{g.saved.toLocaleString('en-IN')} / ₹{g.target.toLocaleString('en-IN')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {linkedGoalId && amount && (
                <div className="text-[11px] text-primary font-bold mt-2 flex items-center gap-1">
                  ✓ Will add ₹{parseFloat(amount).toLocaleString('en-IN')} to {goals.find(g => g.id === linkedGoalId)?.name}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Description</label>
            <Input 
              placeholder="Optional notes..." value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Date</label>
            <Input 
              type="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-secondary/50 border-border/50 rounded-xl"
              required
            />
          </div>

          <DialogFooter className="sheet-action-footer pt-4">
            <Button type="submit" className={`w-full font-bold py-6 rounded-2xl shadow-lg hover:scale-[1.02] transition-all ${
              type === 'expense' ? 'bg-destructive text-white shadow-destructive/20' :
              type === 'income' ? 'bg-primary text-primary-foreground shadow-primary/20' :
              'bg-blue-500 text-white shadow-blue-500/20'
            }`}>
              {type === 'expense' ? '💸 Save Expense' : type === 'income' ? '💰 Save Income' : '🔄 Save Transfer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
