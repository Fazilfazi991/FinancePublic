import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import { receivableStatus, receivableMutationSchema } from '../lib/receivables';
import { getAccountBalance } from '../lib/utils';

const user='10000000-0000-4000-8000-000000000001', other='20000000-0000-4000-8000-000000000002';
const a='10000000-0000-4000-8001-000000000001',b='10000000-0000-4000-8001-000000000002',foreign='20000000-0000-4000-8001-000000000001';
const r='10000000-0000-4000-8002-000000000001',p='10000000-0000-4000-8003-000000000001',q='10000000-0000-4000-8003-000000000002';
let db:PGlite;
const sql=(name:string)=>readFileSync(`supabase/migrations/${name}`,'utf8');
async function rpc(action:string,id=r,amount:number|null=5000,account=a,parent:string|null=null,date='2026-09-01'){
 return db.query(`select public.mutate_owned_receivable($1,$2,$3,'Ahmed',$4,$5,$6,'2026-09-28','Test') as result`,[action,id,parent,amount,account,date]);
}
async function balance(id:string){
 const accounts=(await db.query<{id:string;opening_balance:string;currency:string}>('select * from public.accounts')).rows.map(a=>({...a,openingBalance:Number(a.opening_balance)}));
 const tx=(await db.query<{type:string;amount:string;account_id:string;to_account_id:string;currency:string}>('select * from public.transactions')).rows.map(t=>({...t,accountId:t.account_id,toAccountId:t.to_account_id}));
 return getAccountBalance(id,accounts,tx,{aedToInr:26});
}
async function outstanding(){return Number((await db.query<{outstanding_amount:string}>('select outstanding_amount from public.receivables where id=$1',[r])).rows[0]?.outstanding_amount)}
async function reports(){return (await db.query(`select coalesce(sum(amount) filter(where type='income'),0)::text income,coalesce(sum(amount) filter(where type='expense'),0)::text expense from public.transactions`)).rows[0]}
async function login(id=user){await db.exec(`reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`)}

describe('Receivables: real PostgreSQL migrations, RPCs, RLS and ledger balances',()=>{
 beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
   create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
  await db.exec(sql('20260905000100_secure_multi_user_finance.sql'));
  await db.exec(sql('20260905000200_hardening_and_demo.sql'));
  await db.exec(sql('20260905000300_quick_entry_metadata.sql'));
  await db.exec(sql('20260908000100_atomic_transaction_mutations.sql'));
  await db.exec(sql('20260910043425_receivables.sql'));
  // Applying twice verifies the new migration is idempotent.
  await db.exec(sql('20260910043425_receivables.sql'));
 },30000);
 beforeEach(async()=>{
  await db.exec(`reset role; truncate public.receivable_payments,public.receivables,public.debt_payments,public.transactions,public.accounts,auth.users cascade;
   insert into auth.users(id,email) values('${user}','a@example.invalid'),('${other}','b@example.invalid');
   insert into public.accounts(id,user_id,name,type,currency,opening_balance) values
    ('${a}','${user}','A','current','AED',20000),('${b}','${user}','B','savings','AED',10000),('${foreign}','${other}','Foreign','current','AED',50000);`);
  await login();
 });
 afterAll(async()=>{await db?.close()});
 it('creates a 5000 debit without changing income or expense',async()=>{await rpc('create');expect(await balance(a)).toBe(15000);expect(await outstanding()).toBe(5000);expect(await reports()).toEqual({income:'0',expense:'0'});});
 it('records partial and full repayments without income',async()=>{await rpc('create');await rpc('payment_create',p,1000,b,r);expect(await outstanding()).toBe(4000);expect(await balance(b)).toBe(11000);expect(receivableStatus({original_amount:5000,outstanding_amount:4000,due_date:null})).toBe('Partially Paid');await rpc('payment_create',q,4000,b,r);expect(await outstanding()).toBe(0);expect(await balance(b)).toBe(15000);expect(await reports()).toEqual({income:'0',expense:'0'});});
 it('rolls back overpayment with no ledger or account changes',async()=>{await rpc('create');await rpc('payment_create',p,1000,b,r);const before=(await db.query('select * from public.transactions order by id')).rows;await expect(rpc('payment_create',q,5000,b,r)).rejects.toThrow('exceeds');expect((await db.query('select * from public.transactions order by id')).rows).toEqual(before);expect(await outstanding()).toBe(4000);expect(await balance(b)).toBe(11000);});
 it('moves payment destination and edits amount',async()=>{await rpc('create');await rpc('payment_create',p,1000,a,r);await rpc('payment_update',p,1000,b,r);expect(await balance(a)).toBe(15000);expect(await balance(b)).toBe(11000);expect(await outstanding()).toBe(4000);await rpc('payment_update',p,800,b,r);expect(await balance(b)).toBe(10800);expect(await outstanding()).toBe(4200);});
 it('deletes a payment and restores outstanding',async()=>{await rpc('create');await rpc('payment_create',p,1000,b,r);await rpc('payment_delete',p,null,b,r);expect(await balance(b)).toBe(10000);expect(await outstanding()).toBe(5000);});
 it('edits original amount and source account without duplicate effects',async()=>{await rpc('create');await rpc('payment_create',p,1000,a,r);await rpc('update',r,6000);expect(await balance(a)).toBe(15000);expect(await outstanding()).toBe(5000);await rpc('update',r,6000,b);expect(await balance(a)).toBe(21000);expect(await balance(b)).toBe(4000);expect((await db.query('select * from public.transactions')).rows).toHaveLength(2);});
 it('rejects original amount below payments and invalid chronology',async()=>{await rpc('create');await rpc('payment_create',p,1000,b,r);await expect(rpc('update',r,800)).rejects.toThrow('less than repayments');await expect(rpc('update',r,5000,a,null,'2026-09-02')).rejects.toThrow('after an existing payment');expect(await outstanding()).toBe(4000);});
 it('deletes a receivable with all repayments and reverses all effects',async()=>{await rpc('create');await rpc('payment_create',p,1000,b,r);await rpc('payment_create',q,1000,a,r);await rpc('delete');expect(await balance(a)).toBe(20000);expect(await balance(b)).toBe(10000);expect((await db.query('select * from public.transactions')).rows).toHaveLength(0);expect((await db.query('select * from public.receivable_payments')).rows).toHaveLength(0);});
 it('prevents duplicate submission effects',async()=>{await rpc('create');await rpc('create');await rpc('payment_create',p,1000,b,r);await rpc('payment_create',p,1000,b,r);expect(await outstanding()).toBe(4000);expect(await balance(b)).toBe(11000);});
 it('rejects foreign accounts and isolates RLS and all mutation paths',async()=>{await expect(rpc('create',r,5000,foreign)).rejects.toThrow('Account not found');await rpc('create');await rpc('payment_create',p,1000,b,r);await login(other);expect((await db.query('select * from public.receivables')).rows).toHaveLength(0);expect((await db.query('select * from public.receivable_payments')).rows).toHaveLength(0);for(const action of ['update','delete','payment_create','payment_update','payment_delete'])await expect(rpc(action,action.startsWith('payment')?p:r,1000,foreign,r)).rejects.toThrow('not found');});
 it('denies anon execution, unauthenticated calls and direct table writes',async()=>{await db.exec('reset role; set role anon');await expect(rpc('create')).rejects.toThrow('permission denied');await login('');await expect(rpc('create')).rejects.toThrow('authentication_required');await login();await rpc('create');await expect(db.exec('update public.receivables set outstanding_amount=0')).rejects.toThrow('permission denied');await expect(db.exec('delete from public.receivable_payments')).rejects.toThrow('permission denied');});
 it('blocks direct and generic RPC changes to managed ledger',async()=>{await rpc('create');const tx=(await db.query<{transaction_id:string}>('select transaction_id from public.receivables')).rows[0].transaction_id;await expect(db.query('delete from public.transactions where id=$1',[tx])).rejects.toThrow('Manage this entry');await expect(db.query('select public.delete_owned_transaction($1)',[tx])).rejects.toThrow('Manage this entry');await expect(db.query(`select public.update_owned_transaction($1,'expense',5000,$2,null,'Other','Changed','2026-09-01','AED')`,[tx,a])).rejects.toThrow('Manage this entry');expect(await balance(a)).toBe(15000);});
 it('keeps original income, expense, transfer and debt payment RPC behavior',async()=>{
   await db.exec(`insert into public.transactions(user_id,type,amount,account_id,to_account_id,category,transaction_date,currency) values
    ('${user}','income',500,'${a}',null,'Salary','2026-09-01','AED'),('${user}','expense',200,'${a}',null,'Food','2026-09-01','AED'),('${user}','transfer',300,'${a}','${b}','Transfer','2026-09-01','AED');
    insert into public.debts(id,user_id,name,original_amount,balance) values('${r}','${user}','Loan',1000,1000);`);
   await db.query(`select public.record_debt_payment($1,$2,100,'2026-09-01','')`,[r,a]);
   const tx=(await db.query<{transaction_id:string}>('select transaction_id from public.debt_payments')).rows[0].transaction_id;
   await db.query(`select public.update_owned_transaction($1,'expense',80,$2,null,'Debt Payment','Payment','2026-09-01','AED')`,[tx,b]);
   expect(await balance(a)).toBe(20000);expect(await balance(b)).toBe(10220);
   expect(Number((await db.query<{balance:string}>('select balance from public.debts')).rows[0].balance)).toBe(920);
   await db.query('select public.delete_owned_transaction($1)',[tx]);expect(await balance(b)).toBe(10300);expect(await reports()).toEqual({income:'500.00',expense:'200.00'});
   expect(Number((await db.query<{balance:string}>('select balance from public.debts')).rows[0].balance)).toBe(1000);
 });
 it('rejects mismatched currencies and protects account currency changes',async()=>{await rpc('create');await db.query("update public.accounts set currency='USD' where id=$1",[b]);await expect(rpc('payment_create',p,1000,b,r)).rejects.toThrow('original currency');await expect(db.query("update public.accounts set currency='USD' where id=$1",[a])).rejects.toThrow('used by Money to Receive');});
 it('keeps exact cents through repayment and reversal',async()=>{await rpc('create',r,.3);await rpc('payment_create',p,.1,b,r);await rpc('payment_create',q,.2,b,r);expect(await outstanding()).toBe(0);await rpc('payment_delete',p,null,b,r);expect(await outstanding()).toBe(.1);});
 it('rejects excess queued repayments (single-session PostgreSQL runtime)',async()=>{await rpc('create');const results=await Promise.allSettled([rpc('payment_create',p,3000,b,r),rpc('payment_create',q,3000,b,r)]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(await outstanding()).toBe(2000);});
});
describe('Receivable validation and time-derived statuses',()=>{
 it('derives overdue, settled, partial and active deterministically',()=>{const item={outstanding_amount:5000,original_amount:5000,due_date:'2026-09-09'};expect(receivableStatus(item,'2026-09-10')).toBe('Overdue');expect(receivableStatus(item,'2026-09-09')).toBe('Active');expect(receivableStatus({...item,outstanding_amount:0},'2026-09-10')).toBe('Settled');expect(receivableStatus({...item,outstanding_amount:4000},'2026-09-09')).toBe('Partially Paid');});
 it('validates amounts, dates, accounts and person',()=>{const valid={action:'create',id:r,personName:'Ahmed',amount:5000,accountId:a,date:'2026-09-01'};expect(receivableMutationSchema.safeParse(valid).success).toBe(true);for(const bad of [{amount:0},{amount:.001},{amount:Infinity},{date:'2026-02-30'},{personName:' '},{accountId:''},{dueDate:'2026-08-31'}])expect(receivableMutationSchema.safeParse({...valid,...bad}).success).toBe(false);});
});
