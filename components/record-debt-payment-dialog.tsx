"use client";
import * as React from "react";
import { CreditCard } from "lucide-react";
import { useFinanceStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogTrigger,DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select";

export function RecordDebtPaymentDialog({children,initialDebtId="",open:controlledOpen,onOpenChange}:{children?:React.ReactNode;initialDebtId?:string;open?:boolean;onOpenChange?:(open:boolean)=>void}){
 const {debts,accounts,settings,recordDebtPayment}=useFinanceStore();
 const [internalOpen,setInternalOpen]=React.useState(false),[debtId,setDebtId]=React.useState(initialDebtId),[accountId,setAccountId]=React.useState(""),[amount,setAmount]=React.useState(""),[date,setDate]=React.useState(new Date().toISOString().slice(0,10)),[notes,setNotes]=React.useState("");
 const open=controlledOpen??internalOpen,setOpen=onOpenChange??setInternalOpen;
 React.useEffect(()=>{if(open){setDebtId(initialDebtId||debts.find(d=>d.balance>0)?.id||"");setAccountId(accounts.find(a=>a.isDefault)?.id||accounts.find(a=>a.type!=="credit")?.id||"")}},[open,initialDebtId,debts,accounts]);
 const selected=debts.find(d=>d.id===debtId);
 const submit=(event:React.FormEvent)=>{event.preventDefault();const value=Number(amount);if(!debtId||!accountId||!value)return;recordDebtPayment(debtId,accountId,value,date,notes);setAmount("");setNotes("");setOpen(false)};
 return <Dialog open={open} onOpenChange={setOpen}>{(children||controlledOpen===undefined)&&<DialogTrigger asChild>{children||<Button><CreditCard className="mr-2 h-4 w-4"/>Record payment</Button>}</DialogTrigger>}<DialogContent className="max-h-[92dvh] overflow-y-auto border-border bg-card sm:max-w-[460px] sm:rounded-2xl max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl"><DialogHeader><DialogTitle className="text-xl">Record debt payment</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-4 py-4">
  <div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground">Debt</label><Select value={debtId} onValueChange={setDebtId}><SelectTrigger className="min-h-12 rounded-xl bg-secondary/50"><SelectValue placeholder="Choose debt"/></SelectTrigger><SelectContent>{debts.filter(d=>d.balance>0).map(d=><SelectItem key={d.id} value={d.id}>{d.name} · {formatCurrency(d.balance,settings.currency)}</SelectItem>)}</SelectContent></Select></div>
  {selected&&<p className="rounded-xl bg-primary/10 p-3 text-sm text-primary">Remaining after payment: {formatCurrency(Math.max(0,selected.balance-(Number(amount)||0)),settings.currency)}</p>}
  <div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground">Amount</label><Input type="number" inputMode="decimal" min="1" max={selected?.balance} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="₹0" className="min-h-14 rounded-xl bg-secondary/50 text-xl font-semibold" required/></div>
  <div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground">Pay from account</label><Select value={accountId} onValueChange={setAccountId}><SelectTrigger className="min-h-12 rounded-xl bg-secondary/50"><SelectValue placeholder="Choose account"/></SelectTrigger><SelectContent>{accounts.filter(a=>a.type!=="credit"&&a.type!=="receivable").map(a=><SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
  <div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground">Date</label><Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="min-h-12 rounded-xl bg-secondary/50" required/></div>
  <div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground">Notes <span className="font-normal">(optional)</span></label><Input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add a note" className="min-h-12 rounded-xl bg-secondary/50"/></div>
  <DialogFooter><Button type="submit" disabled={!debts.length||!accounts.length} className="min-h-12 w-full rounded-xl font-semibold">Record payment</Button></DialogFooter>
 </form></DialogContent></Dialog>
}
