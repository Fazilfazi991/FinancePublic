"use client";
import { useEffect, useRef, useState } from 'react';
import { HandCoins, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useReceivables } from '@/hooks/use-receivables';
import { localDate, receivableStatus, type Receivable, type ReceivablePayment, type ReceivableMutation } from '@/lib/receivables';
import { useFinanceStore } from '@/lib/store';
import { formatCurrency, cn } from '@/lib/utils';
import { trackEventSafely } from '@/lib/analytics/client';

const control='[color-scheme:light] dark:[color-scheme:dark] min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
type Editor={kind:'receivable'|'payment'; receivable?:Receivable; payment?:ReceivablePayment; id:string};
export default function ReceivablesPage(){
 const {items,loading,error,reload}=useReceivables();
 const {accounts,hydrate}=useFinanceStore();
 const [search,setSearch]=useState(''),[filter,setFilter]=useState('All'),[sort,setSort]=useState('Newest');
 const [selected,setSelected]=useState<string|null>(null),[editor,setEditor]=useState<Editor|null>(null);
 const [deletion,setDeletion]=useState<ReceivableMutation|null>(null),[pending,setPending]=useState(false),[notice,setNotice]=useState(''),[mutationError,setMutationError]=useState('');
 const busy=useRef(false);
 useEffect(()=>{const tx=new URLSearchParams(window.location.search).get('transaction');if(tx){const r=items.find(r=>r.transaction_id===tx||r.receivable_payments.some(p=>p.transaction_id===tx));if(r)setSelected(r.id)}},[items]);
 const current=items.find(r=>r.id===selected);
 const moneyAccounts=accounts.filter(a=>a.type!=='receivable' && !a.isDemo);
 async function mutate(input:ReceivableMutation){
   if(busy.current)return;busy.current=true;setPending(true);setMutationError('');setNotice('');
   try{
     const response=await fetch('/api/receivables',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
     const result=await response.json();if(!response.ok)throw new Error(result?.error?.message||'Unable to save.');
     const events={create:'receivable_created',update:'receivable_updated',delete:'receivable_deleted',payment_create:'receivable_payment_created',payment_update:'receivable_payment_updated',payment_delete:'receivable_payment_deleted'} as const;
     trackEventSafely(events[input.action]);setEditor(null);setDeletion(null);
     if(input.action==='delete')setSelected(null);
     setNotice(Number(result.outstanding_amount)===0&&!result.deleted?'Fully repaid 🎉':'Change saved.');
     await reload();
     const workspace=await fetch('/api/workspace',{cache:'no-store'});
     if(workspace.ok)hydrate(await workspace.json());else setNotice('Change saved. Refresh the app to update account balances.');
   }catch(caught){setMutationError(caught instanceof Error?caught.message:'Unable to save.');}
   finally{busy.current=false;setPending(false);}
 }
 function openEditor(value:Editor){setMutationError('');setEditor(value)}
 function askDelete(value:ReceivableMutation){setMutationError('');setDeletion(value)}
 const currencies=[...new Set(items.map(r=>r.currency))];
 const visible=items.filter(r=>r.person_name.toLowerCase().includes(search.toLowerCase())).filter(r=>filter==='All'||(filter==='Active'?Number(r.outstanding_amount)>0:receivableStatus(r)===filter)).sort((a,b)=>{
   if(sort==='Highest Outstanding'||sort==='Lowest Outstanding')return (sort==='Highest Outstanding'?-1:1)*(Number(a.outstanding_amount)-Number(b.outstanding_amount));
   if(sort==='Due Soon')return (a.due_date||'9999').localeCompare(b.due_date||'9999');
   if(sort==='Overdue')return Number(receivableStatus(b)==='Overdue')-Number(receivableStatus(a)==='Overdue')||(a.due_date||'9999').localeCompare(b.due_date||'9999');
   return (sort==='Newest'?-1:1)*a.created_at.localeCompare(b.created_at);
 });
 const newPayment=(r:Receivable)=>openEditor({kind:'payment',receivable:r,id:crypto.randomUUID()});
 return <main className="mobile-page">
   <header className="space-y-3"><h1 className="text-3xl font-bold tracking-tight">Money to Receive</h1><p className="text-muted-foreground">Keep track of money you&apos;ve lent and every repayment.</p><Button className="min-h-11 w-full sm:w-auto" onClick={()=>openEditor({kind:'receivable',id:crypto.randomUUID()})}><Plus className="mr-2 h-4 w-4"/>Add Money to Receive</Button></header>
   {notice&&<p role="status" className="rounded-xl bg-primary/10 p-3 text-sm text-primary">{notice}</p>}
   {mutationError&&!editor&&!deletion&&<p role="alert" className="text-[hsl(var(--destructive-text))]">{mutationError}</p>}
   {error?<section role="alert" className="mobile-card p-5"><p>{error}</p><Button className="mt-3 min-h-11" variant="outline" onClick={()=>void reload()}>Retry</Button></section>:loading?<p role="status">Loading Money to Receive…</p>:<>
   {currencies.map(currency=>{const rows=items.filter(r=>r.currency===currency),sum=(key:'original_amount'|'outstanding_amount')=>rows.reduce((s,r)=>s+Number(r[key]),0);return <section key={currency} aria-label={`${currency} summary`} className="mobile-card grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
     <Metric label="Outstanding" value={formatCurrency(sum('outstanding_amount'),currency)}/><Metric label="Received Back" value={formatCurrency(sum('original_amount')-sum('outstanding_amount'),currency)}/><Metric label="Overdue" value={formatCurrency(rows.filter(r=>receivableStatus(r)==='Overdue').reduce((s,r)=>s+Number(r.outstanding_amount),0),currency)}/><Metric label="People" value={String(rows.filter(r=>Number(r.outstanding_amount)>0).length)} />
   </section>})}
   {items.length>0&&<section className="space-y-3"><label className="block text-sm font-medium">Search by person<Input className="mt-1 min-h-11 text-base" placeholder="Person name" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Show<select className={control+' mt-1'} value={filter} onChange={e=>setFilter(e.target.value)}>{['All','Active','Overdue','Settled'].map(v=><option key={v}>{v}</option>)}</select></label><label className="text-sm font-medium">Sort<select className={control+' mt-1'} value={sort} onChange={e=>setSort(e.target.value)}>{['Newest','Oldest','Highest Outstanding','Lowest Outstanding','Due Soon','Overdue'].map(v=><option key={v}>{v}</option>)}</select></label></div>{currencies.length>1&&<p className="text-xs text-muted-foreground">Amounts are grouped by currency. Amount sorting compares the displayed numbers.</p>}</section>}
   {!items.length?<section className="mobile-card p-6"><HandCoins className="mb-4 h-8 w-8 text-primary"/><h2 className="text-xl font-semibold">You don&apos;t have any money to receive yet.</h2><p className="mt-2 text-muted-foreground">Track money you&apos;ve lent to friends, family, or anyone else, and record repayments as they come in.</p></section>:!visible.length?<p>No matching receivables.</p>:<div className="grid gap-4 md:grid-cols-2">{visible.map(r=><section key={r.id} className="mobile-card min-w-0 p-5"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="min-w-0 break-words text-xl font-semibold">{r.person_name}</h2><Status item={r}/></div><Balances item={r}/><p className="mt-3 text-sm text-muted-foreground">{r.due_date?`Due ${r.due_date}`:'No due date'}</p><div className="mt-3 flex flex-wrap gap-2">{Number(r.outstanding_amount)>0&&<Button className="min-h-11" onClick={()=>newPayment(r)}>Record Payment</Button>}<Button variant="outline" className="min-h-11" onClick={()=>setSelected(r.id)}>View</Button><Button variant="ghost" className="min-h-11" onClick={()=>openEditor({kind:'receivable',receivable:r,id:r.id})}>Edit</Button><Button variant="ghost" className="min-h-11 text-[hsl(var(--destructive-text))]" onClick={()=>askDelete({action:'delete',id:r.id,notes:''})}>Delete</Button></div></section>)}</div>}
   </>}
   <Dialog open={!!current&&!editor&&!deletion} onOpenChange={open=>{if(!open)setSelected(null)}}><DialogContent className="finance-sheet max-h-[90dvh] overflow-y-auto [&>button.absolute]:h-11 [&>button.absolute]:w-11"><DialogHeader><DialogTitle>{current?.person_name}</DialogTitle><DialogDescription>Money lent and repayment history</DialogDescription></DialogHeader>{current&&<><Status item={current}/><Balances item={current}/><dl className="space-y-2 text-sm"><div><dt className="text-muted-foreground">Date lent</dt><dd>{current.lent_date}</dd></div><div><dt className="text-muted-foreground">Due date</dt><dd>{current.due_date||'No due date'}</dd></div><div><dt className="text-muted-foreground">Source account</dt><dd>{accounts.find(a=>a.id===current.source_account_id)?.name||'Account'}</dd></div><div><dt className="text-muted-foreground">Notes</dt><dd className="whitespace-pre-wrap break-words">{current.notes||'No notes'}</dd></div></dl>{Number(current.outstanding_amount)>0&&<Button className="min-h-11" onClick={()=>newPayment(current)}>Record Payment</Button>}<h3 className="mt-2 font-semibold">Payment history</h3>{current.receivable_payments.length?[...current.receivable_payments].sort((a,b)=>b.payment_date.localeCompare(a.payment_date)).map(p=><article key={p.id} className="border-t border-border pt-3"><p className="font-semibold tabular-nums">{formatCurrency(Number(p.amount),current.currency)}</p><p className="text-sm text-muted-foreground">{p.payment_date} · {accounts.find(a=>a.id===p.destination_account_id)?.name||'Account'}</p>{p.notes&&<p className="mt-1 break-words text-sm">{p.notes}</p>}<div className="flex gap-2"><Button className="min-h-11" variant="ghost" onClick={()=>openEditor({kind:'payment',receivable:current,payment:p,id:p.id})}>Edit payment</Button><Button className="min-h-11 text-[hsl(var(--destructive-text))]" variant="ghost" onClick={()=>askDelete({action:'payment_delete',id:p.id,receivableId:current.id,notes:''})}>Delete payment</Button></div></article>):<p className="text-sm text-muted-foreground">No repayments recorded yet.</p>}</>}</DialogContent></Dialog>
   {editor&&<EditorDialog key={editor.id} editor={editor} accounts={moneyAccounts} pending={pending} error={mutationError} onClose={()=>{if(!pending)setEditor(null)}} onSave={mutate}/>}
   <Dialog open={!!deletion} onOpenChange={open=>{if(!open&&!pending)setDeletion(null)}}><DialogContent className="[&>button.absolute]:h-11 [&>button.absolute]:w-11"><DialogHeader><DialogTitle>{deletion?.action==='delete'?'Delete money to receive?':'Delete this payment?'}</DialogTitle><DialogDescription>{deletion?.action==='delete'?'This reverses the original account debit and every repayment credit, and removes the payment history.':'This reverses the account credit and restores the outstanding amount.'}</DialogDescription></DialogHeader>{mutationError&&<p role="alert" className="text-[hsl(var(--destructive-text))]">{mutationError}</p>}<Button variant="destructive" className="min-h-11" disabled={pending} onClick={()=>deletion&&void mutate(deletion)}>{pending?'Deleting…':'Delete and reverse balances'}</Button><Button variant="outline" className="min-h-11" disabled={pending} onClick={()=>setDeletion(null)}>Cancel</Button></DialogContent></Dialog>
 </main>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words font-semibold tabular-nums">{value}</p></div>}
function Status({item}:{item:Receivable}){const status=receivableStatus(item);return <span className={cn('rounded-full px-2 py-1 text-xs font-semibold',status==='Overdue'?'bg-destructive/10 text-[hsl(var(--destructive-text))]':status==='Settled'?'bg-primary/10 text-primary':'bg-secondary text-secondary-foreground')}>{status}</span>}
function Balances({item:r}:{item:Receivable}){const received=Number(r.original_amount)-Number(r.outstanding_amount),progress=Math.min(100,received/Number(r.original_amount)*100);return <div className="mt-4"><p className="text-sm text-muted-foreground">Originally lent {formatCurrency(Number(r.original_amount),r.currency)}</p><div className="mt-3 grid grid-cols-2 gap-3"><Metric label="Received" value={formatCurrency(received,r.currency)}/><Metric label="Remaining" value={formatCurrency(Number(r.outstanding_amount),r.currency)}/></div><progress aria-label={`${Math.round(progress)}% repaid`} className="mt-3 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary" value={received} max={Number(r.original_amount)}/><p className="mt-1 text-xs text-muted-foreground">{Math.round(progress)}% repaid</p></div>}
function EditorDialog({editor:e,accounts,pending,error,onClose,onSave}:{editor:Editor;accounts:ReturnType<typeof useFinanceStore.getState>['accounts'];pending:boolean;error:string;onClose:()=>void;onSave:(v:ReceivableMutation)=>Promise<void>}){
 const payment=e.kind==='payment',r=e.receivable,p=e.payment;
 const [amount,setAmount]=useState(String(p?.amount??(!payment?r?.original_amount:'')??''));
 const eligible=accounts.filter(a=>!r||a.currency===r.currency);
 return <Dialog open onOpenChange={open=>{if(!open)onClose()}}><DialogContent className="finance-sheet max-h-[90dvh] overflow-y-auto [&>button.absolute]:h-11 [&>button.absolute]:w-11"><DialogHeader><DialogTitle>{payment?(p?'Edit payment':'Record Payment'):(r?'Edit Money to Receive':'Add Money to Receive')}</DialogTitle><DialogDescription>{payment?`Repayment from ${r?.person_name}. This does not count as income.`:'The amount leaves your account without counting as an expense.'}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);void onSave({action:payment?(p?'payment_update':'payment_create'):(r?'update':'create'),id:e.id,receivableId:payment?r?.id:undefined,personName:payment?undefined:String(data.get('name')),amount:Number(amount),accountId:String(data.get('account')),date:String(data.get('date')),dueDate:payment?undefined:String(data.get('due'))||null,notes:String(data.get('notes'))})}}>
 {!payment&&<label className="block text-sm font-medium">Person / Borrower Name<Input name="name" required maxLength={100} defaultValue={r?.person_name} className="mt-1 min-h-11 text-base"/></label>}
 <label className="block text-sm font-medium">Amount{r?` (${r.currency})`:''}<Input name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" max={payment?Number(r?.outstanding_amount)+Number(p?.amount||0):9000000000000} required value={amount} onChange={event=>setAmount(event.target.value)} className="mt-1 min-h-11 text-base"/></label>
 {payment&&!p&&<Button type="button" variant="outline" className="min-h-11" onClick={()=>setAmount(String(r?.outstanding_amount))}>Full remaining amount</Button>}
 <label className="block text-sm font-medium">{payment?'Received Into':'Account'}<select name="account" required className={control+' mt-1'} defaultValue={p?.destination_account_id??(!payment?r?.source_account_id:undefined)??''}><option value="" disabled>Select account</option>{eligible.map(a=><option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}</select></label>
 {!eligible.length&&<p className="text-sm text-muted-foreground">Add a real account{r?` in ${r.currency}`:''} in Accounts first. Sample accounts cannot be used.</p>}
 <label className="block text-sm font-medium">{payment?'Date':'Date Lent'}<input name="date" type="date" required min={payment?r?.lent_date:undefined} defaultValue={p?.payment_date??(!payment?r?.lent_date:undefined)??localDate()} className={control+' mt-1'}/></label>
 {!payment&&<label className="block text-sm font-medium">Due Date (optional)<input name="due" type="date" defaultValue={r?.due_date??''} className={control+' mt-1'}/></label>}
 <label className="block text-sm font-medium">Notes (optional)<Textarea name="notes" maxLength={500} defaultValue={p?.notes??(!payment?r?.notes:'')} className="mt-1 text-base"/></label>
 {error&&<p role="alert" className="text-sm text-[hsl(var(--destructive-text))]">{error}</p>}
 <Button type="submit" className="min-h-11 w-full" disabled={pending||!eligible.length}>{pending?'Saving…':'Save'}</Button><Button type="button" variant="ghost" className="min-h-11 w-full" disabled={pending} onClick={onClose}><ArrowLeft className="mr-2 h-4 w-4"/>Cancel</Button>
 </form></DialogContent></Dialog>;
}
