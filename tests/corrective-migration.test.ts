import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';

const correction=readFileSync('supabase/migrations/20260910061937_restore_ai_checks_and_harden_grants.sql','utf8');
const aiTables=['ai_conversations','ai_messages','ai_usage'];
const ddlPrivileges=['TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'];
async function baseline() {
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create schema auth;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz,last_sign_in_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.role() returns text language sql stable as $$select nullif(current_setting('request.jwt.claim.role',true),'')$$;
 alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
 alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;`);
 for(const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&f<'20260910043425').sort()) await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
 await db.exec(`alter table public.ai_conversations drop constraint ai_conversations_title_check;
 alter table public.ai_messages drop constraint ai_messages_content_check;
 alter table public.ai_usage drop constraint ai_usage_request_count_check;`);
 return db;
}
describe('Corrective migration: AI enforcement and narrowly scoped grants',()=>{
 let db:PGlite;
 beforeAll(async()=>{db=await baseline();await db.exec(correction)},30000);
 afterAll(async()=>{await db?.close()});
 it('restores all three validated checks',async()=>{
  const result=await db.query<{conname:string;convalidated:boolean}>(`select conname,convalidated from pg_constraint where conname in ('ai_conversations_title_check','ai_messages_content_check','ai_usage_request_count_check') order by conname`);
  expect(result.rows).toHaveLength(3);expect(result.rows.every(r=>r.convalidated)).toBe(true);
 });
 it('rejects invalid values with the named check, without production data',async()=>{
  const user='70000000-0000-4000-8000-000000000001';
  await db.query('insert into auth.users(id,email) values($1,$2)',[user,'correction-test@example.invalid']);
  const conv=(await db.query<{id:string}>('insert into ai_conversations(user_id,title) values($1,$2) returning id',[user,'Valid'])).rows[0].id;
  for(const title of ['', 'x'.repeat(121)]) await expect(db.query('insert into ai_conversations(user_id,title) values($1,$2)',[user,title])).rejects.toThrow('ai_conversations_title_check');
  for(const content of ['', 'x'.repeat(12001)]) await expect(db.query('insert into ai_messages(conversation_id,user_id,role,content) values($1,$2,$3,$4)',[conv,user,'user',content])).rejects.toThrow('ai_messages_content_check');
  await expect(db.query('insert into ai_usage(user_id,period_start,request_count) values($1,$2,-1)',[user,'2026-09-01'])).rejects.toThrow('ai_usage_request_count_check');
 });
 it('accepts exact valid boundaries',async()=>{
  const user='70000000-0000-4000-8000-000000000001';
  for(const length of [1,120]) await db.query('insert into ai_conversations(user_id,title) values($1,$2)',[user,'x'.repeat(length)]);
  const conv=(await db.query<{id:string}>('select id from ai_conversations limit 1')).rows[0].id;
  for(const length of [1,12000]) await db.query('insert into ai_messages(conversation_id,user_id,role,content) values($1,$2,$3,$4)',[conv,user,'user','x'.repeat(length)]);
  await db.query('insert into ai_usage(user_id,period_start,request_count) values($1,$2,0)',[user,'2026-09-01']);
 });
 it('removes unsafe privileges while preserving app and operational access',async()=>{
  for(const table of aiTables)for(const role of ['anon','authenticated','service_role'])for(const privilege of ['SELECT','INSERT','UPDATE','DELETE',...ddlPrivileges]){
   const expected=role==='service_role'||(role==='authenticated'&&!ddlPrivileges.includes(privilege)&&!(table==='ai_usage'&&privilege==='DELETE'));
   expect((await db.query<{allowed:boolean}>('select has_table_privilege($1,$2,$3) allowed',[role,`public.${table}`,privilege])).rows[0].allowed,`${role} ${table} ${privilege}`).toBe(expected);
  }
  for(const table of ['accounts','transactions','debts','debt_payments'])for(const privilege of ['SELECT','INSERT','UPDATE','DELETE'])expect((await db.query<{allowed:boolean}>('select has_table_privilege($1,$2,$3) allowed',['authenticated',`public.${table}`,privilege])).rows[0].allowed).toBe(true);
 });
 it('is repeatable and leaves financial function definitions unchanged',async()=>{
  const query="select pg_get_functiondef(oid) definition from pg_proc where proname in ('record_debt_payment','update_owned_transaction','delete_owned_transaction') order by proname";
  const before=(await db.query(query)).rows;await db.exec(correction);expect((await db.query(query)).rows).toEqual(before);
 });
 it('aborts atomically if a preexisting row violates a check',async()=>{
  const invalid=await baseline();
  try {
   await invalid.exec(`insert into auth.users(id,email) values('70000000-0000-4000-8000-000000000002','invalid-test@example.invalid');
    insert into ai_conversations(user_id,title) values('70000000-0000-4000-8000-000000000002','');`);
   await expect(invalid.exec(correction)).rejects.toThrow('AI constraint violations exist');await invalid.exec('rollback');
   expect((await invalid.query("select conname from pg_constraint where conname='ai_conversations_title_check'")).rows).toHaveLength(0);
   expect((await invalid.query<{allowed:boolean}>("select has_table_privilege('authenticated','public.accounts','TRUNCATE') allowed")).rows[0].allowed).toBe(true);
  } finally {await invalid.close()}
 },30000);
});
