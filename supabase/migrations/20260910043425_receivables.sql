begin;

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check(type in ('income','expense','transfer','receivable_out','receivable_repayment'));

create table if not exists public.receivables (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  person_name text not null check(char_length(trim(person_name)) between 1 and 100),
  original_amount numeric(19,2) not null check(original_amount>0),
  outstanding_amount numeric(19,2) not null check(outstanding_amount>=0 and outstanding_amount<=original_amount),
  source_account_id uuid not null, transaction_id uuid not null unique,
  currency text not null check(currency ~ '^[A-Z]{3}$'), lent_date date not null,
  due_date date check(due_date>=lent_date), notes text not null default '' check(char_length(notes)<=500),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id),
  foreign key(source_account_id,user_id) references public.accounts(id,user_id),
  foreign key(transaction_id,user_id) references public.transactions(id,user_id)
);
create table if not exists public.receivable_payments (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  receivable_id uuid not null, transaction_id uuid not null unique,
  amount numeric(19,2) not null check(amount>0), destination_account_id uuid not null,
  payment_date date not null, notes text not null default '' check(char_length(notes)<=500),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(receivable_id,user_id) references public.receivables(id,user_id),
  foreign key(destination_account_id,user_id) references public.accounts(id,user_id),
  foreign key(transaction_id,user_id) references public.transactions(id,user_id)
);
create index if not exists receivables_user_created on public.receivables(user_id,created_at desc);
create index if not exists receivables_user_due on public.receivables(user_id,due_date) where outstanding_amount>0;
create index if not exists receivable_payments_history on public.receivable_payments(user_id,receivable_id,payment_date desc);
create index if not exists receivables_source_account on public.receivables(source_account_id);
create index if not exists receivable_payments_destination_account on public.receivable_payments(destination_account_id);
alter table public.receivables enable row level security;
alter table public.receivable_payments enable row level security;
revoke all on public.receivables,public.receivable_payments from public,anon,authenticated;
grant select on public.receivables,public.receivable_payments to authenticated;
drop policy if exists receivables_select_own on public.receivables;
create policy receivables_select_own on public.receivables for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists receivable_payments_select_own on public.receivable_payments;
create policy receivable_payments_select_own on public.receivable_payments for select to authenticated using ((select auth.uid())=user_id);

-- Invoker trigger: generic transaction RPCs and direct Data API writes must not
-- change managed ledger rows. Only the table owner's atomic RPC can write them.
create or replace function private.guard_receivable_ledger() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if (TG_OP<>'INSERT' and old.type in ('receivable_out','receivable_repayment'))
     or (TG_OP<>'DELETE' and new.type in ('receivable_out','receivable_repayment')) then
    if current_user <> pg_catalog.pg_get_userbyid((select relowner from pg_catalog.pg_class where oid='public.transactions'::regclass)) then
      raise exception 'Manage this entry in Money to Receive.' using errcode='42501';
    end if;
  end if;
  if TG_OP='DELETE' then return old; end if; return new;
end $$;
revoke all on function private.guard_receivable_ledger() from public,anon,authenticated;
drop trigger if exists guard_receivable_ledger on public.transactions;
create trigger guard_receivable_ledger before insert or update or delete on public.transactions
for each row execute function private.guard_receivable_ledger();

-- Existing SECURITY DEFINER convention with explicit auth, ownership, empty
-- search_path and execute grants. All money is numeric; balances derive from ledger.
create or replace function public.mutate_owned_receivable(p_action text,p_id uuid,
  p_receivable_id uuid default null,p_person_name text default null,p_amount numeric default null,
  p_account_id uuid default null,p_date date default null,p_due_date date default null,p_notes text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  uid uuid:=auth.uid(); r public.receivables; pay public.receivable_payments;
  a public.accounts; tid uuid; paid numeric; previous numeric:=0; txids uuid[];
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if p_action is null or p_action not in ('create','update','delete','payment_create','payment_update','payment_delete') or p_id is null then raise exception 'Invalid operation.'; end if;
  -- Serializes all mutations for this owner, including idempotent create retries.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text, 791));
  if p_action='create' then
    select * into r from public.receivables where id=p_id and user_id=uid;
    if found then return to_jsonb(r); end if;
  else
    select * into r from public.receivables where id=case when p_action like 'payment_%' then p_receivable_id else p_id end and user_id=uid for update;
    if not found then raise exception 'Money to receive not found.' using errcode='P0002'; end if;
  end if;
  if p_action='payment_create' then
    select * into pay from public.receivable_payments where id=p_id and user_id=uid and receivable_id=r.id;
    if found then return to_jsonb(r); end if;
  elsif p_action in ('payment_update','payment_delete') then
    select * into pay from public.receivable_payments where id=p_id and receivable_id=r.id and user_id=uid for update;
    if not found then raise exception 'Payment not found.' using errcode='P0002'; end if;
    previous:=pay.amount;
  end if;
  if p_action='delete' then
    select array_agg(transaction_id) into txids from public.receivable_payments where receivable_id=r.id and user_id=uid;
    delete from public.receivable_payments where receivable_id=r.id and user_id=uid;
    delete from public.receivables where id=r.id and user_id=uid;
    delete from public.transactions where user_id=uid and (id=r.transaction_id or id=any(txids));
    return jsonb_build_object('deleted',true);
  elsif p_action='payment_delete' then
    delete from public.receivable_payments where id=pay.id and user_id=uid;
    delete from public.transactions where id=pay.transaction_id and user_id=uid;
    update public.receivables set outstanding_amount=outstanding_amount+previous,updated_at=now() where id=r.id and user_id=uid returning * into r;
    return to_jsonb(r);
  end if;
  if p_amount is null or p_amount::text in ('NaN','Infinity','-Infinity') or p_amount<=0 or p_amount>9000000000000 or p_amount<>round(p_amount,2) then raise exception 'Enter a positive amount with at most two decimal places.'; end if;
  if p_date is null or not isfinite(p_date) or char_length(coalesce(p_notes,''))>500 then raise exception 'Enter a valid date and notes of at most 500 characters.'; end if;
  select * into a from public.accounts where id=p_account_id and user_id=uid for share;
  if not found then raise exception 'Account not found.' using errcode='P0002'; end if;
  if a.is_demo or a.type='receivable' then raise exception 'Choose a real money account.'; end if;
  if r.id is not null and a.currency<>r.currency then raise exception 'Choose an account in the original currency.'; end if;
  if p_action in ('create','update') then
    if p_person_name is null or char_length(trim(p_person_name)) not between 1 and 100 or (p_due_date is not null and (not isfinite(p_due_date) or p_due_date<p_date)) then raise exception 'Enter a person name and a due date on or after the date lent.'; end if;
    paid:=coalesce(r.original_amount-r.outstanding_amount,0);
    if p_amount<paid then raise exception 'Original amount cannot be less than repayments already received.'; end if;
    if exists(select 1 from public.receivable_payments where receivable_id=r.id and user_id=uid and payment_date<p_date) then raise exception 'Date lent cannot be after an existing payment.'; end if;
    if p_action='create' then
      insert into public.transactions(user_id,type,amount,account_id,category,description,transaction_date,currency,notes)
      values(uid,'receivable_out',p_amount,a.id,'Money lent',trim(p_person_name),p_date,a.currency,coalesce(p_notes,'')) returning id into tid;
      insert into public.receivables(id,user_id,person_name,original_amount,outstanding_amount,source_account_id,transaction_id,currency,lent_date,due_date,notes)
      values(p_id,uid,trim(p_person_name),p_amount,p_amount,a.id,tid,a.currency,p_date,p_due_date,coalesce(p_notes,'')) returning * into r;
    else
      update public.transactions set amount=p_amount,account_id=a.id,description=trim(p_person_name),transaction_date=p_date,notes=coalesce(p_notes,'') where id=r.transaction_id and user_id=uid;
      update public.receivables set person_name=trim(p_person_name),original_amount=p_amount,outstanding_amount=p_amount-paid,source_account_id=a.id,lent_date=p_date,due_date=p_due_date,notes=coalesce(p_notes,''),updated_at=now() where id=r.id and user_id=uid returning * into r;
    end if;
  else
    if p_amount>r.outstanding_amount+previous then raise exception 'Payment exceeds the outstanding amount.'; end if;
    if p_date<r.lent_date then raise exception 'Payment date must be on or after the date lent.'; end if;
    if p_action='payment_create' then
      insert into public.transactions(user_id,type,amount,account_id,category,description,transaction_date,currency,notes)
      values(uid,'receivable_repayment',p_amount,a.id,'Money returned',r.person_name,p_date,r.currency,coalesce(p_notes,'')) returning id into tid;
      insert into public.receivable_payments(id,user_id,receivable_id,transaction_id,amount,destination_account_id,payment_date,notes)
      values(p_id,uid,r.id,tid,p_amount,a.id,p_date,coalesce(p_notes,''));
    else
      update public.transactions set amount=p_amount,account_id=a.id,transaction_date=p_date,notes=coalesce(p_notes,'') where id=pay.transaction_id and user_id=uid;
      update public.receivable_payments set amount=p_amount,destination_account_id=a.id,payment_date=p_date,notes=coalesce(p_notes,''),updated_at=now() where id=pay.id and user_id=uid;
    end if;
    update public.receivables set outstanding_amount=outstanding_amount+previous-p_amount,updated_at=now() where id=r.id and user_id=uid returning * into r;
  end if;
  return to_jsonb(r);
end $$;
revoke all on function public.mutate_owned_receivable(text,uuid,uuid,text,numeric,uuid,date,date,text) from public,anon,authenticated;
grant execute on function public.mutate_owned_receivable(text,uuid,uuid,text,numeric,uuid,date,date,text) to authenticated;

-- Account deletion is already blocked by composite FKs. Keep its currency stable
-- while receivables reference it, including accounts used only for repayments.
create or replace function private.guard_receivable_account_currency() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.currency<>old.currency and (exists(select 1 from public.receivables where source_account_id=old.id)
   or exists(select 1 from public.receivable_payments where destination_account_id=old.id)) then
   raise exception 'This account currency is used by Money to Receive.';
 end if; return new;
end $$;
revoke all on function private.guard_receivable_account_currency() from public,anon,authenticated;
drop trigger if exists guard_receivable_account_currency on public.accounts;
create trigger guard_receivable_account_currency before update of currency on public.accounts for each row execute function private.guard_receivable_account_currency();
commit;
