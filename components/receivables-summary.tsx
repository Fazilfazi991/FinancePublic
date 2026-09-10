"use client";
import Link from 'next/link';
import { HandCoins, ArrowRight } from 'lucide-react';
import { useReceivables } from '@/hooks/use-receivables';
import { formatCurrency } from '@/lib/utils';
export function ReceivablesSummary() {
  const {items,loading,error}=useReceivables();
  const active=items.filter(r=>Number(r.outstanding_amount)>0);
  const currencies=[...new Set(items.map(r=>r.currency))];
  return <section className="mobile-card p-5"><div className="flex items-center gap-3"><HandCoins className="h-5 w-5 text-primary"/><h2 className="font-semibold">Money to Receive</h2></div>
    {loading?<p className="mt-3 text-sm text-muted-foreground">Loading…</p>:error?<p className="mt-3 text-sm text-muted-foreground">Summary unavailable. Open details to retry.</p>:<><div className="mt-3 space-y-1">{currencies.length?currencies.map(currency=><p key={currency} className="break-words text-2xl font-bold tabular-nums">{formatCurrency(active.filter(r=>r.currency===currency).reduce((sum,r)=>sum+Number(r.outstanding_amount),0),currency)}</p>):<p className="text-sm text-muted-foreground">No money to receive yet.</p>}</div><p className="mt-1 text-sm text-muted-foreground">Across {active.length} active receivables</p></>}
    <Link className="mt-2 flex min-h-11 items-center gap-2 font-semibold text-primary" href="/receivables">See details<ArrowRight className="h-4 w-4"/></Link></section>;
}
