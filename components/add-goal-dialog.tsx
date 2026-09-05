"use client";

import * as React from "react";
import { useFinanceStore, type Goal } from "@/lib/store";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Plus } from "lucide-react";

export const GOAL_CATEGORIES = ["Emergency Fund", "Home", "Car", "Travel", "Education", "Family", "Business", "Health", "Other"] as const;
const emptyForm = {name:"",category:"",customCategory:"",description:"",target:"",saved:"",deadline:""};

export function AddGoalDialog({ children, open: controlledOpen, onOpenChange }: { children?: React.ReactNode; open?: boolean; onOpenChange?: (open:boolean)=>void }) {
  const settings=useFinanceStore(state=>state.settings);
  const [internalOpen,setInternalOpen]=React.useState(false),[form,setForm]=React.useState(emptyForm),[errors,setErrors]=React.useState<Record<string,string>>({}),[saving,setSaving]=React.useState(false),[savedMessage,setSavedMessage]=React.useState("");
  const open=controlledOpen??internalOpen;
  const setOpen=(next:boolean)=>{(onOpenChange??setInternalOpen)(next);if(!next){setForm(emptyForm);setErrors({});setSavedMessage("")}};
  const update=(key:keyof typeof form,value:string)=>{setForm(current=>({...current,[key]:value}));setErrors(current=>({...current,[key]:""}))};
  const validate=()=>{const next:Record<string,string>={},target=Number(form.target),saved=Number(form.saved||0);if(!form.name.trim())next.name='Enter a goal name.';if(!form.category)next.category='Choose a category.';if(!Number.isFinite(target)||target<=0)next.target='Enter a target amount greater than zero.';if(!Number.isFinite(saved)||saved<0)next.saved='Already saved cannot be negative.';else if(target>0&&saved>target)next.saved='Already saved cannot be more than the target.';setErrors(next);return Object.keys(next).length===0};
  const handleSubmit=async(event:React.FormEvent)=>{event.preventDefault();if(!validate()||saving)return;setSaving(true);const category=form.category==='Other'?(form.customCategory.trim()||'Other'):form.category;try{const response=await fetch('/api/goals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.name.trim(),target:Number(form.target),saved:Number(form.saved||0),deadline:form.deadline||null,description:form.description.trim(),category})});const result=await response.json();if(!response.ok)throw new Error(result?.error?.message??'The goal could not be created.');const goal:Goal={id:result.id,name:result.name,target:Number(result.target),saved:Number(result.saved??0),deadline:result.deadline??undefined,description:result.description??'',category:result.category??'',notes:result.notes??'',createdAt:result.created_at,lastUpdated:result.updated_at??result.created_at};useFinanceStore.setState(state=>({goals:[...state.goals,goal]}));setSavedMessage('Goal created');window.setTimeout(()=>setOpen(false),450)}catch(reason){setErrors({form:reason instanceof Error?reason.message:'The goal could not be created.'})}finally{setSaving(false)}};
  const currency=settings.currency==='INR'?'₹':settings.currency;
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{children??<Button className="tap-target gap-2 rounded-xl"><Plus className="h-4 w-4"/>New Goal</Button>}</DialogTrigger>
    <DialogContent className="finance-sheet border-border bg-card sm:max-w-[440px] sm:rounded-2xl [&_input]:text-base [&_textarea]:text-base">
      <DialogHeader><DialogTitle className="text-xl font-bold">New Goal</DialogTitle><DialogDescription>Create something worth working toward.</DialogDescription></DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-5 py-2" noValidate>
        <GoalField id="goal-name" label="Goal name" error={errors.name}><Input id="goal-name" value={form.name} onChange={e=>update('name',e.target.value)} placeholder="Emergency Fund" autoComplete="off" className="min-h-12 rounded-xl bg-secondary/40" aria-invalid={!!errors.name}/></GoalField>
        <GoalField id="goal-category" label="Category" error={errors.category}><Select value={form.category} onValueChange={value=>update('category',value)}><SelectTrigger id="goal-category" className="min-h-12 rounded-xl bg-secondary/40" aria-invalid={!!errors.category}><SelectValue placeholder="Choose a category"/></SelectTrigger><SelectContent>{GOAL_CATEGORIES.map(category=><SelectItem key={category} value={category} className="min-h-10">{category}</SelectItem>)}</SelectContent></Select>{form.category==='Other'&&<Input value={form.customCategory} onChange={e=>update('customCategory',e.target.value)} placeholder="Custom category" aria-label="Custom category" className="mt-2 min-h-12 rounded-xl bg-secondary/40"/>}</GoalField>
        <GoalField id="goal-description" label="Description (optional)"><Textarea id="goal-description" value={form.description} onChange={e=>update('description',e.target.value)} placeholder="Why this goal matters" maxLength={300} className="min-h-20 rounded-xl bg-secondary/40"/></GoalField>
        <GoalField id="goal-target" label="Target amount" error={errors.target}><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">{currency}</span><Input id="goal-target" type="number" inputMode="decimal" min="0.01" step="0.01" value={form.target} onChange={e=>update('target',e.target.value)} placeholder="3,00,000" className="min-h-12 rounded-xl bg-secondary/40 pl-9 tabular" aria-invalid={!!errors.target}/></div></GoalField>
        <GoalField id="goal-saved" label="Already saved (optional)" error={errors.saved}><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span><Input id="goal-saved" type="number" inputMode="decimal" min="0" step="0.01" value={form.saved} onChange={e=>update('saved',e.target.value)} placeholder="0" className="min-h-12 rounded-xl bg-secondary/30 pl-9 tabular" aria-invalid={!!errors.saved}/></div></GoalField>
        <GoalField id="goal-deadline" label="Target date (optional)"><Input id="goal-deadline" type="date" value={form.deadline} onChange={e=>update('deadline',e.target.value)} className="min-h-12 rounded-xl bg-secondary/40"/></GoalField>
        {errors.form&&<p role="alert" className="text-sm text-destructive">{errors.form}</p>}{savedMessage&&<p role="status" className="flex items-center gap-2 text-sm font-medium text-primary"><Check className="h-4 w-4"/>{savedMessage}</p>}
        <DialogFooter><Button type="submit" disabled={saving} className="tap-target min-h-12 w-full rounded-xl font-semibold active:scale-[.98]">{saving?'Creating…':'Create Goal'}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

function GoalField({id,label,error,children}:{id:string;label:string;error?:string;children:React.ReactNode}){return <div className="space-y-2"><label htmlFor={id} className="text-sm font-semibold">{label}</label>{children}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>}
