"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Check, LoaderCircle, Send, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { parseAssistantInput, requiredAssistantFields } from "@/lib/assistant/parser";
import { answerInsight } from "@/lib/assistant/insights";
import type { AssistantDraft } from "@/lib/assistant/types";
import { GOAL_CATEGORIES } from "@/lib/goals";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/quick-entry/rules";
import { useFinanceStore, type Debt, type Goal, type Transaction } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { trackEventSafely } from "@/lib/analytics/client";

type Message = { id: string; role: "user" | "assistant"; text: string };
const hiddenRoutes = ["/", "/auth", "/privacy", "/terms", "/onboarding"];
const prompts = ["Add expense", "Add income", "Add debt", "Add goal", "Record payment", "How much debt is left?", "What should I pay next?"];
const labels = { expense: "Expense", income: "Income", debt: "Debt", goal: "Goal", debt_payment: "Debt payment" } as const;
const draftId = () => crypto.randomUUID();

export function ZeroDebtAssistant() {
  const pathname = usePathname();
  const state = useFinanceStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState<AssistantDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [thinking, setThinking] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const defaultAccount = useMemo(() => state.accounts.find((account) => account.isDefault && account.type !== "credit" && account.type !== "receivable") ?? state.accounts.find((account) => !["credit", "receivable", "investment"].includes(account.type)), [state.accounts]);
  const hidden = hiddenRoutes.some((route) => route === "/" ? pathname === route : pathname.startsWith(route));

  useEffect(() => { if (!hidden) fetch("/api/ai/chat").then((response) => response.ok ? response.json() : null).then((data) => setAiEnabled(Boolean(data?.configured))).catch(() => setAiEnabled(false)); }, [hidden]);
  useEffect(() => { if (localStorage.getItem("finance-debt-strategy") === "snowball") setStrategy("snowball"); }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }, [messages, draft, saving, reduceMotion]);
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [open]);
  if (hidden) return null;

  const addMessage = (role: Message["role"], text: string) => setMessages((current) => [...current, { id: draftId(), role, text }]);
  const handleInput = async (raw: string) => {
    const clean = raw.trim();
    if (!clean || thinking || saving) return;
    setError(""); setDraft(null); addMessage("user", clean); setInput("");
    trackEventSafely("ai_advisor_message_sent", { conversation_state: messages.length ? "continuing" : "new" });
    const parsed = parseAssistantInput(clean, { defaultAccountId: defaultAccount?.id, debts: state.debts });
    if (parsed.type === "action") { setDraft(parsed.draft); addMessage("assistant", parsed.draft.needs.length ? `I started a ${labels[parsed.draft.kind].toLowerCase()} draft. Add the missing details, then review and confirm.` : `Here’s the ${labels[parsed.draft.kind].toLowerCase()} draft. Nothing will be saved until you confirm.`); return; }
    if (parsed.type === "insight") {
      const amount = Number(clean.match(/(?:₹|rs\.?|inr|aed|\$)?\s*(\d[\d,]*(?:\.\d{1,2})?)/i)?.[1]?.replaceAll(",", "") ?? 0);
      addMessage("assistant", answerInsight(parsed.insight, { accounts: state.accounts, debts: state.debts, goals: state.goals, transactions: state.transactions, currency: state.settings.currency, aedToInr: state.settings.aedToInr, strategy, extraAmount: amount }));
      return;
    }
    if (aiEnabled) {
      setThinking(true);
      try { const response = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: clean }) }); const result = await response.json(); if (!response.ok) throw new Error(result?.error?.message); addMessage("assistant", result.answer); }
      catch (reason) { setError(reason instanceof Error ? reason.message : "AI guidance is unavailable right now."); addMessage("assistant", "I can still add expenses, income, debts, goals, and debt payments, or answer questions about the totals in your workspace."); }
      finally { setThinking(false); }
      return;
    }
    addMessage("assistant", "I can help with entries and account-based answers without AI. Try “grocery 900”, “goal car 300000”, “paid 5000 credit card”, or “How much debt is left?”");
  };

  const saveDraft = async () => {
    if (!draft || saving) return;
    const needs = requiredAssistantFields(draft);
    if (needs.length) { setDraft({ ...draft, needs }); setError(`Add ${needs.join(" and ")} before confirming.`); return; }
    setSaving(true); setError("");
    try {
      if (draft.kind === "expense" || draft.kind === "income") await saveTransaction(draft, state);
      else if (draft.kind === "debt") await saveDebt(draft);
      else if (draft.kind === "goal") await saveGoal(draft);
      else await state.recordDebtPayment(draft.debtId!, draft.accountId!, draft.amount!, draft.date);
      addMessage("assistant", `${labels[draft.kind]} saved. Your ZeroDebt totals are up to date.`); setDraft(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "That item could not be saved. Check the details and try again."); }
    finally { setSaving(false); }
  };

  return <>
    <motion.button type="button" onClick={() => { setOpen(true); trackEventSafely("ai_advisor_opened", { placement: "floating_button" }); }} aria-label="Ask ZeroDebt" aria-expanded={open} initial={reduceMotion ? false : { opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .22, ease: [0.16, 1, 0.3, 1] }} className="assistant-fab tap-target fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 p-1 shadow-[0_10px_28px_rgba(0,83,56,.28)] ring-1 ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-emerald-950 lg:bottom-6 lg:right-6">
      <Image src="/assistant/zerodebt-assistant-avatar.webp" width={48} height={48} alt="" priority className="h-12 w-12 object-contain"/>
    </motion.button>
    <AnimatePresence>
      {open && <motion.div className="fixed inset-0 z-[70] bg-slate-950/45 lg:flex lg:items-stretch lg:justify-end" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <motion.section role="dialog" aria-modal="true" aria-labelledby="assistant-title" className="assistant-sheet safe-bottom absolute inset-x-0 bottom-0 flex max-h-[min(88dvh,760px)] min-h-[560px] flex-col overflow-hidden rounded-t-2xl bg-card shadow-[0_-12px_40px_rgba(15,23,42,.2)] lg:relative lg:h-dvh lg:max-h-none lg:min-h-0 lg:w-[420px] lg:rounded-none" initial={reduceMotion ? false : { y: 32, opacity: .7 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: .2, ease: [0.16, 1, 0.3, 1] }}>
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 p-0.5 ring-1 ring-primary/15 dark:bg-emerald-950"><Image src="/assistant/zerodebt-assistant-avatar.webp" width={40} height={40} alt="" className="h-10 w-10 object-contain"/></span>
            <div className="min-w-0 flex-1"><h2 id="assistant-title" className="font-semibold">Ask ZeroDebt</h2><p className="text-xs text-muted-foreground">Your financial copilot</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="tap-target grid place-items-center rounded-full text-muted-foreground hover:bg-secondary"><X className="h-5 w-5"/></button>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.length === 0 && <Welcome onPrompt={handleInput}/>}
            {messages.map((message) => <article key={message.id} className={message.role === "user" ? "ml-10 rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground" : "mr-6 flex gap-2.5"}>{message.role === "assistant" && <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Bot className="h-4 w-4"/></span>}<p className="whitespace-pre-line text-sm leading-6">{message.text}</p></article>)}
            {draft && <DraftCard
              draft={draft}
              setDraft={setDraft}
              accounts={state.accounts}
              debts={state.debts}
              currency={state.settings.currency}
              saving={saving}
              onConfirm={saveDraft}
              onCancel={() => { setDraft(null); setError(""); addMessage("assistant", "Draft cancelled. Nothing was saved."); }}
            />}
            {thinking && <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin"/>Reviewing your finances…</div>}
            {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <div ref={bottom}/>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); handleInput(input); }} className="border-t border-border bg-card p-3">
            <div className="flex items-end gap-2 rounded-2xl bg-secondary/70 p-2 focus-within:ring-2 focus-within:ring-ring"><label htmlFor="assistant-input" className="sr-only">Ask or add a financial item</label><textarea id="assistant-input" rows={1} maxLength={800} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); handleInput(input); } }} placeholder="Ask a question or add an item…" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none"/><button type="submit" disabled={!input.trim() || saving || thinking} aria-label="Send" className="tap-target grid place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"><Send className="h-5 w-5"/></button></div>
            <p className="mt-2 px-1 text-[11px] text-muted-foreground">Every financial change requires your confirmation.</p>
          </form>
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  </>;
}

function Welcome({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return <div><div className="rounded-2xl bg-primary p-5 text-primary-foreground"><Sparkles className="h-6 w-6"/><h3 className="mt-4 text-xl font-semibold">What can I help you move forward?</h3><p className="mt-2 text-sm leading-6 text-primary-foreground/80">Hi — I can help you understand your debt, add transactions, create goals, or plan what to do next. I’ll always show a review before saving.</p></div><div className="mt-4 flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => onPrompt(prompt)} className="tap-target rounded-full border border-border bg-card px-3 py-2 text-left text-xs font-medium hover:bg-secondary active:scale-[.98]">{prompt}</button>)}</div></div>;
}

function DraftCard({ draft, setDraft, accounts, debts, currency, saving, onConfirm, onCancel }: { draft: AssistantDraft; setDraft: (draft: AssistantDraft) => void; accounts: ReturnType<typeof useFinanceStore.getState>["accounts"]; debts: Debt[]; currency: string; saving: boolean; onConfirm: () => void; onCancel: () => void }) {
  const update = <K extends keyof AssistantDraft>(key: K, value: AssistantDraft[K]) => setDraft({ ...draft, [key]: value, needs: draft.needs.filter((need) => need !== ({ accountId: "account", debtId: "debt" } as Record<string, string>)[key as string] && need !== key) });
  return <section className="ml-9 overflow-hidden rounded-2xl border border-border bg-background" aria-label={`${labels[draft.kind]} review`}><div className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="font-semibold">Review {labels[draft.kind]}</p><p className="text-xs text-muted-foreground">Edit anything before saving</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">Draft</span></div><div className="space-y-3 p-4">
    {(draft.kind === "debt" || draft.kind === "goal") && <Field label="Name"><input value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder={draft.kind === "goal" ? "Car, emergency fund…" : "Credit card, personal loan…"} className="assistant-field"/></Field>}
    <Field label="Amount"><input type="number" inputMode="decimal" min="0.01" step="0.01" value={draft.amount ?? ""} onChange={(event) => update("amount", event.target.value ? Number(event.target.value) : null)} placeholder="0" className="assistant-field tabular"/><span className="pointer-events-none absolute right-3 top-[2.35rem] text-xs text-muted-foreground">{currency}</span></Field>
    {(draft.kind === "expense" || draft.kind === "income") && <Field label="Category"><select value={draft.category} onChange={(event) => update("category", event.target.value)} className="assistant-field">{(draft.kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((category) => <option key={category}>{category}</option>)}</select></Field>}
    {draft.kind === "goal" && <><Field label="Goal category"><select value={draft.category} onChange={(event) => update("category", event.target.value)} className="assistant-field">{GOAL_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field><Field label="Deadline (optional)"><input type="date" value={draft.deadline} onChange={(event) => update("deadline", event.target.value)} className="assistant-field"/></Field></>}
    {draft.kind === "debt" && <div className="grid grid-cols-2 gap-2"><Field label="APR %"><input type="number" min="0" step=".01" value={draft.rate ?? ""} onChange={(event) => update("rate", event.target.value ? Number(event.target.value) : null)} className="assistant-field"/></Field><Field label="Minimum"><input type="number" min="0" step=".01" value={draft.minimumPayment ?? ""} onChange={(event) => update("minimumPayment", event.target.value ? Number(event.target.value) : null)} className="assistant-field"/></Field></div>}
    {draft.kind === "debt_payment" && <Field label="Debt"><select value={draft.debtId ?? ""} onChange={(event) => update("debtId", event.target.value || null)} className="assistant-field"><option value="">Choose debt</option>{debts.filter((debt) => debt.balance > 0).map((debt) => <option key={debt.id} value={debt.id}>{debt.name} · {formatCurrency(debt.balance, currency)}</option>)}</select></Field>}
    {(draft.kind === "expense" || draft.kind === "income" || draft.kind === "debt_payment") && <Field label={draft.kind === "income" ? "Deposit account" : "Account"}><select value={draft.accountId ?? ""} onChange={(event) => update("accountId", event.target.value || null)} className="assistant-field"><option value="">Choose account</option>{accounts.filter((account) => !["credit", "receivable", "investment"].includes(account.type)).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>}
    {(draft.kind === "expense" || draft.kind === "income") && <Field label="Description"><input value={draft.name} onChange={(event) => update("name", event.target.value)} className="assistant-field"/></Field>}
    {draft.needs.length > 0 && <p className="text-xs text-amber-700 dark:text-amber-300">Still needed: {draft.needs.join(", ")}</p>}
  </div><div className="grid grid-cols-[1fr_1.6fr] gap-2 border-t border-border p-3"><button type="button" onClick={onCancel} disabled={saving} className="tap-target rounded-xl px-3 text-sm font-semibold hover:bg-secondary">Cancel</button><button type="button" onClick={onConfirm} disabled={saving} className="tap-target flex items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}{saving ? "Saving…" : "Confirm & save"}</button></div></section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="relative block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>; }

async function jsonRequest(url: string, body: unknown) { const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) throw new Error(result?.error?.message ?? "The item could not be saved."); return result; }
async function saveTransaction(draft: AssistantDraft, state: ReturnType<typeof useFinanceStore.getState>) { const account = state.accounts.find((item) => item.id === draft.accountId)!; const row = await jsonRequest("/api/transactions", { type: draft.kind, amount: draft.amount, accountId: draft.accountId, category: draft.category || "Other", description: draft.name || draft.category, date: draft.date, currency: account.currency, source: "manual", idempotencyKey: crypto.randomUUID() }); const transaction: Transaction = { id: row.id, type: row.type, amount: Number(row.amount), accountId: row.account_id, category: row.category, description: row.description, date: row.transaction_date, currency: row.currency, createdAt: row.created_at, notes: row.notes ?? "" }; useFinanceStore.setState((current) => ({ transactions: [transaction, ...current.transactions] })); }
async function saveDebt(draft: AssistantDraft) { const row = await jsonRequest("/api/debts", { name: draft.name.trim(), balance: draft.amount, total: draft.amount, rate: draft.rate, minPayment: draft.minimumPayment, color: "#E24B4A", notes: "Added through Ask ZeroDebt" }); const debt: Debt = { id: row.id, name: row.name, total: Number(row.original_amount), balance: Number(row.balance), rate: Number(row.apr ?? 0), minPayment: Number(row.minimum_payment ?? 0), color: row.color ?? "#E24B4A", notes: row.notes ?? "" }; useFinanceStore.setState((current) => ({ debts: [...current.debts, debt] })); }
async function saveGoal(draft: AssistantDraft) { const row = await jsonRequest("/api/goals", { name: draft.name.trim(), target: draft.amount, saved: 0, deadline: draft.deadline || null, description: draft.description, category: draft.category || "Personal", notes: "Added through Ask ZeroDebt" }); const goal: Goal = { id: row.id, name: row.name, target: Number(row.target), saved: Number(row.saved ?? 0), deadline: row.deadline ?? undefined, description: row.description ?? "", category: row.category ?? "Personal", createdAt: row.created_at, notes: row.notes ?? "" }; useFinanceStore.setState((current) => ({ goals: [...current.goals, goal] })); }
