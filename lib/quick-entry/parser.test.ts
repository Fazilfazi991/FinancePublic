import { describe, expect, it } from 'vitest';
import { parseQuickEntry } from './parser';
const options = { today: '2026-09-05', defaultAccountId: 'account-1', debts: [
  { id: 'credit', name: 'Credit Card' }, { id: 'personal', name: 'Personal Loan' }, { id: 'gold', name: 'Gold Loan' },
] };
describe('parseQuickEntry', () => {
  it.each([['biryani 500','Food & Dining'],['fuel 1200','Fuel'],['spent 500 on lunch','Food & Dining'],['paid 2500 electricity','Bills & Utilities'],['groceries 3200','Groceries'],['₹750 coffee','Food & Dining'],['2k shopping','Shopping']])('parses expense %s', (input, category) => { const d=parseQuickEntry(input,options); expect(d).toMatchObject({type:'expense',category,account_id:'account-1'}); expect(d.warnings.join(' ')).not.toContain('debt'); });
  it.each([['salary 120000','Salary'],['received salary 120000','Salary'],['freelance 25000','Freelance'],['bonus 30000','Bonus']])('parses income %s', (input, category) => expect(parseQuickEntry(input,options)).toMatchObject({type:'income',category}));
  it.each([['paid 10000 credit card','credit',10000,'2026-09-05'],['credit card payment 8000','credit',8000,'2026-09-05'],['paid 5000 towards personal loan','personal',5000,'2026-09-05'],['paid 25000 gold loan yesterday','gold',25000,'2026-09-04']])('parses debt payment %s', (input,debt_id,amount,date) => expect(parseQuickEntry(input,options)).toMatchObject({type:'debt_payment',debt_id,amount,date}));
  it.each([['coffee 1,200',1200],['coffee ₹1,200',1200],['shopping 2k',2000],['shopping 2.5k',2500],['rent 1 lakh',100000],['rent 1.5 lakh',150000]])('parses amount %s', (input,amount) => expect(parseQuickEntry(input,options).amount).toBe(amount));
  it.each(['500','paid 500','loan 10000','random text'])('does not guess ambiguous input %s', input => { const d=parseQuickEntry(input,options); expect(d.type).toBe('unknown'); expect(d.confidence).toBe('low'); });
  it('reports ambiguous debt matches',()=>{const d=parseQuickEntry('paid 5000 credit card',{...options,debts:[{id:'a',name:'Credit Card'},{id:'b',name:'Credit Card'}]});expect(d.debt_id).toBeNull();expect(d.warnings.join(' ')).toContain('More than one');});
  it('requires an account when none is configured',()=>expect(parseQuickEntry('fuel 500',{...options,defaultAccountId:null}).warnings.join(' ')).toContain('account'));
  it.each(['coffee 0','coffee -500','coffee nope'])('rejects zero, negative, or invalid amounts: %s', input=>expect(parseQuickEntry(input,options).amount).toBeNull());
  it('defaults dates to today',()=>expect(parseQuickEntry('fuel 500 today',options).date).toBe('2026-09-05'));
});
