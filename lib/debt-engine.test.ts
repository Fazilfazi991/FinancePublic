import {describe,expect,it} from 'vitest'; import {calculatePayoff,freedomNumber,orderDebts} from './debt-engine';
const debts=[{id:'card',balance:58000,apr:18.9,minimumPayment:5000},{id:'loan',balance:440000,apr:10.5,minimumPayment:18000},{id:'gold',balance:210000,apr:11.5,minimumPayment:10000}];
describe('debt engine',()=>{
 it('sums Freedom Number to paise',()=>expect(freedomNumber([{balance:0.1},{balance:0.2}])).toBe(.3));
 it('orders avalanche',()=>expect(orderDebts(debts,'avalanche').map(x=>x.id)).toEqual(['card','gold','loan']));
 it('orders snowball',()=>expect(orderDebts(debts,'snowball').map(x=>x.id)).toEqual(['card','gold','loan']));
 it('handles zero balances',()=>expect(calculatePayoff([{id:'x',balance:0,apr:5,minimumPayment:1}],1,'avalanche').status).toBe('debt_free'));
 it('reports minimum shortfall',()=>expect(calculatePayoff(debts,1000,'avalanche').shortfall).toBe(32000));
 it('handles zero and negative power',()=>{expect(calculatePayoff([{id:'x',balance:10,apr:0,minimumPayment:0}],0,'snowball').status).toBe('unpayable');expect(calculatePayoff(debts,-1,'snowball').status).toBe('minimum_shortfall')});
 it('flags missing APR but retains debt',()=>{const r=calculatePayoff([{id:'x',balance:100,apr:null,minimumPayment:10}],20,'avalanche');expect(r.estimateQuality).toBe('missing_apr');expect(r.months).toBe(5)});
 it('calculates interest and rollover',()=>{const r=calculatePayoff([{id:'a',balance:100,apr:12,minimumPayment:20},{id:'b',balance:200,apr:0,minimumPayment:20}],100,'snowball',new Date('2026-01-01'));expect(r.status).toBe('ok');expect(r.totalInterest).toBeGreaterThan(0);expect(r.payoffDates.a).toBeTruthy();expect(r.debtFreeDate).toBeTruthy()});
});
