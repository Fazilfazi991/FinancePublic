import type { QuickEntryDraft } from '../quick-entry/parser';
const money=(value:number,currency='INR')=>new Intl.NumberFormat(currency==='INR'?'en-IN':undefined,{style:'currency',currency,maximumFractionDigits:2}).format(value);
export function draftMessage(draft:QuickEntryDraft,account:string,debt?:string){const image=draft.source==='telegram_image';const heading=image?'Payment detected':draft.type==='debt_payment'?'Debt payment detected':draft.type==='income'?'Income detected':'Expense detected';return [heading,'',money(draft.amount!,draft.currency),image?draft.description:draft.type==='debt_payment'?debt:draft.category,image?draft.category:draft.type==='expense'?draft.description:null,draft.date,draft.warnings.includes('Please review carefully.')?'Please review carefully.':null,'',draft.type==='income'?'Deposit to:':'From:',account].filter(Boolean).join('\n')}
export const helpMessage='Send a transaction, then confirm the draft.\n\nExamples:\nbiryani 500\nfuel 1200\nsalary 120000\npaid 10000 credit card';
export const ambiguousMessage=(amount:number|null)=>`${amount?`I found ${money(amount)}, but `:'I '}need more information.\n\nTry:\nexpense 500 food\nsalary 50000\npaid 5000 credit card`;
export const connectedMessage='ZeroDebt is connected to your ZeroDebt account.\n\nYou can now send expenses, income and debt payments here.\n\nTry:\nbiryani 500\nsalary 120000\npaid 10000 credit card';
export const linkedStartMessage='ZeroDebt is connected and ready.\n\nSend something like:\nbiryani 500';
export const unlinkedStartMessage='Connect ZeroDebt to your ZeroDebt account first.\n\nOpen ZeroDebt → More → Telegram → Connect Telegram.';
export const expiredLinkMessage='This connection link has expired.\n\nReturn to Finance and generate a new one.';
export const invalidLinkMessage='This connection link is invalid or has already been used.\n\nReturn to Finance and generate a new one.';
export const unexpectedMessage='Something went wrong while handling that message. Please try again. If it continues, open Finance and reconnect Telegram.';
