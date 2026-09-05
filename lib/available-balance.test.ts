import {describe,expect,it} from 'vitest';
import {calculateAvailableBalance} from './utils';

const settings={aedToInr:25};
const account=(id:string,type:string,openingBalance:number)=>({id,type,openingBalance,currency:'INR'});

describe('calculateAvailableBalance',()=>{
 it('returns zero and zero accounts for an empty workspace',()=>expect(calculateAvailableBalance([],[],settings)).toEqual({balance:0,accountCount:0}));
 it('includes a bank current account',()=>expect(calculateAvailableBalance([account('bank','current',5000)],[],settings)).toEqual({balance:5000,accountCount:1}));
 it('combines current, savings, and cash accounts',()=>{const accounts=[account('a','current',1000),account('b','savings',2000),account('c','cash',500)];expect(calculateAvailableBalance(accounts,[],settings)).toEqual({balance:3500,accountCount:3})});
 it('excludes credit liabilities, receivables, and investments',()=>{const accounts=[account('a','savings',2000),account('b','credit',9000),account('c','receivable',3000),account('d','investment',4000)];expect(calculateAvailableBalance(accounts,[],settings)).toEqual({balance:2000,accountCount:1})});
 it('uses transaction-adjusted live balances',()=>{const accounts=[account('a','savings',1000),account('b','cash',100)];const transactions=[{type:'income',amount:500,accountId:'a',currency:'INR'},{type:'expense',amount:200,accountId:'a',currency:'INR'},{type:'transfer',amount:100,accountId:'a',toAccountId:'b',currency:'INR'}];expect(calculateAvailableBalance(accounts,transactions,settings)).toEqual({balance:1400,accountCount:2})});
});
