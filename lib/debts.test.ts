import {describe,expect,it} from "vitest";
import {freedomNumber,orderDebts} from "./debt-engine";
import {normalizeDebtRecord} from "./debts";

describe("multi-debt safety",()=>{
 it("normalizes optional persisted fields for first, second, and third debts",()=>{
  const debts=[
   normalizeDebtRecord({id:"a",name:"Card",balance:58000,original_amount:120000,apr:18.9,minimum_payment:5000}),
   normalizeDebtRecord({id:"b",name:"Loan",balance:200000,original_amount:null,apr:null,minimum_payment:null}),
   normalizeDebtRecord({id:"c",name:"Family",balance:"30000",original_amount:undefined,apr:undefined,minimum_payment:undefined}),
  ];
  expect(debts).toHaveLength(3);expect(debts[1]).toMatchObject({rate:0,minPayment:0,total:200000});expect(debts[2].total).toBe(30000);
  expect(freedomNumber(debts)).toBe(288000);expect(orderDebts(debts.map(d=>({id:d.id,balance:d.balance,apr:d.rate,minimumPayment:d.minPayment})),"avalanche")).toHaveLength(3);
 });
 it("turns NaN and Infinity into safe finite values",()=>{const debt=normalizeDebtRecord({id:"safe",balance:Infinity,original_amount:NaN,apr:Infinity,minimum_payment:NaN});expect([debt.balance,debt.total,debt.rate,debt.minPayment].every(Number.isFinite)).toBe(true)});
});
