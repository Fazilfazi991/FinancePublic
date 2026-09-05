import type { QuickEntryDraft } from '../quick-entry/parser';
const money=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(value);
export function draftMessage(draft:QuickEntryDraft,account:string,debt?:string){const heading=draft.type==='debt_payment'?'Debt payment detected':draft.type==='income'?'Income detected':'Expense detected';return [heading,'',money(draft.amount!),draft.type==='debt_payment'?debt:draft.category,draft.type==='expense'?draft.description:null,draft.date,'',draft.type==='income'?'Deposit to:':'From:',account].filter(Boolean).join('\n')}
export const helpMessage='Send a transaction, then confirm the draft.\n\nExamples:\nbiryani 500\nfuel 1200\nsalary 120000\npaid 10000 credit card';
export const ambiguousMessage=(amount:number|null)=>`${amount?`I found ${money(amount)}, but `:'I '}need more information.\n\nTry:\nexpense 500 food\nsalary 50000\npaid 5000 credit card`;
