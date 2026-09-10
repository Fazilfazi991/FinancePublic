"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Pencil, Trash2, Wallet } from "lucide-react";
import { AddTransactionDialog } from "@/components/add-transaction-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type Transaction, useFinanceStore } from "@/lib/store";
import { cn, formatCurrency } from "@/lib/utils";

export function TransactionActions({ transaction, children }: { transaction: Transaction; children: React.ReactElement }) {
  const { accounts, deleteTransaction } = useFinanceStore();
  const [open, setOpen] = React.useState(false), [editOpen, setEditOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false), [deleting, setDeleting] = React.useState(false), [error, setError] = React.useState("");
  const account = accounts.find(item => item.id === transaction.accountId);
  const destination = accounts.find(item => item.id === transaction.toAccountId);
  const name = transaction.description || transaction.category;
  const accountText = transaction.type === "transfer" ? `${account?.name ?? "Account"} → ${destination?.name ?? "Account"}` : account?.name ?? "Account";
  const startEdit = () => { setOpen(false); window.setTimeout(() => setEditOpen(true), 180); };
  const remove = async () => {
    if (deleting) return;
    setDeleting(true); setError("");
    try { await deleteTransaction(transaction.id); setOpen(false); setConfirming(false); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "The transaction could not be deleted."); }
    finally { setDeleting(false); }
  };

  if (transaction.type.startsWith("receivable_")) return <Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent className="[&>button.absolute]:h-11 [&>button.absolute]:w-11"><DialogHeader><DialogTitle>{transaction.category}</DialogTitle></DialogHeader><p>{name} · {formatCurrency(transaction.amount, transaction.currency)}</p><p className="text-sm text-muted-foreground">This balance movement is managed with its repayment history.</p><Link className="tap-target flex items-center text-primary" href={`/receivables?transaction=${transaction.id}`}>Manage in Money to Receive</Link></DialogContent></Dialog>;

  return <>
    <Dialog open={open} onOpenChange={value => { if (!deleting) { setOpen(value); if (!value) { setConfirming(false); setError(""); } } }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="finance-sheet max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl sm:max-w-sm sm:rounded-2xl">
        <DialogHeader><DialogTitle>{confirming ? "Delete this transaction?" : name}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-2xl bg-secondary/60 p-4">
            <p className="tabular text-2xl font-bold">{formatCurrency(transaction.amount, transaction.currency)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{accountText} · {new Date(`${transaction.date}T12:00:00`).toLocaleDateString()}</p>
          </div>
          {confirming ? <>
            <p className="text-sm text-muted-foreground">This will update your account balance and reports.</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" disabled={deleting} onClick={() => setConfirming(false)}>Cancel</Button>
              <Button type="button" variant="destructive" disabled={deleting} onClick={remove}>{deleting ? "Deleting…" : "Delete"}</Button>
            </div>
          </> : <div className="space-y-2">
            <Button type="button" variant="outline" className="min-h-12 w-full justify-start gap-3 rounded-xl" onClick={startEdit}><Pencil className="h-4 w-4"/>Edit</Button>
            <Button type="button" variant="outline" className="min-h-12 w-full justify-start gap-3 rounded-xl text-destructive hover:text-destructive" onClick={() => setConfirming(true)}><Trash2 className="h-4 w-4"/>Delete</Button>
            <Button type="button" variant="ghost" className="min-h-12 w-full rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
          </div>}
        </div>
      </DialogContent>
    </Dialog>
    <AddTransactionDialog transaction={transaction} open={editOpen} onOpenChange={setEditOpen}/>
  </>;
}

export function TransactionRow({ transaction, variant = "activity", accountId }: { transaction: Transaction; variant?: "activity" | "account"; accountId?: string }) {
  const { accounts, settings } = useFinanceStore();
  const account = accounts.find(item => item.id === transaction.accountId);
  const Icon = variant === "account" ? Wallet : (transaction.type === "income" || transaction.type === "receivable_repayment") ? ArrowDownLeft : transaction.type === "transfer" ? ArrowLeftRight : ArrowUpRight;
  const positive = transaction.type === "income" || transaction.type === "receivable_repayment" || (transaction.type === "transfer" && transaction.toAccountId === accountId);
  return <TransactionActions transaction={transaction}>
    <button type="button" aria-label={`Open actions for ${transaction.description || transaction.category}`} className={cn("flex w-full items-center gap-3 px-4 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",variant === "activity" ? "min-h-[76px]" : "min-h-[68px]")}>
      <span className={cn("grid shrink-0 place-items-center rounded-xl",variant === "activity" ? "h-11 w-11" : "h-10 w-10",variant === "activity" && ((transaction.type === "income" || transaction.type === "receivable_repayment") ? "bg-emerald-500/10 text-emerald-600" : transaction.type === "transfer" ? "bg-sky-500/10 text-sky-500" : "bg-secondary"),variant === "account" && "bg-secondary")}><Icon className="h-5 w-5"/></span>
      <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{transaction.description || transaction.category}</span><span className="block truncate text-xs text-muted-foreground">{variant === "activity" ? `${transaction.category}${account ? ` · ${account.name}` : ""}` : transaction.date}</span></span>
      <span className={cn("tabular whitespace-nowrap font-semibold",variant === "activity" ? "text-sm" : "",variant === "activity" && ((transaction.type === "income" || transaction.type === "receivable_repayment") ? "text-emerald-600" : transaction.type === "transfer" ? "text-sky-500" : "text-foreground"))}>{variant === "account" ? (positive ? "+" : "-") : (transaction.type === "income" || transaction.type === "receivable_repayment") ? "+" : (transaction.type === "expense" || transaction.type === "receivable_out") ? "−" : ""}{formatCurrency(transaction.amount,transaction.currency || settings.currency)}</span>
    </button>
  </TransactionActions>;
}
