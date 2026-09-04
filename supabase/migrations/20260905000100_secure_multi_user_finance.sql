create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'User', country_code text,
  base_currency text not null default 'INR' check (base_currency ~ '^[A-Z]{3}$'),
  locale text not null default 'en-IN', onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payoff_strategy text not null default 'avalanche' check (payoff_strategy in ('avalanche','snowball')),
  theme text not null default 'system' check (theme in ('system','light','dark')),
  accent_color text not null default '#10b981', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.accounts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100), institution text not null default '',
  type text not null check (type in ('savings','current','credit','cash','investment','receivable')),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'), opening_balance numeric(19,2) not null default 0,
  color text not null default '#10b981', is_default boolean not null default false, notes text not null default '',
  tag text not null default '', icon text not null default 'wallet', is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.incomes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, type text not null default 'Business', status text not null default 'active', currency text check (currency ~ '^[A-Z]{3}$'),
  expected_monthly numeric(19,2) not null default 0 check(expected_monthly>=0), actual_this_month numeric(19,2) not null default 0 check(actual_this_month>=0),
  notes text not null default '', color text not null default '#10b981', icon text not null default 'briefcase', linked_account_id uuid,
  is_demo boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id),
  foreign key(linked_account_id,user_id) references public.accounts(id,user_id)
);
create table public.debts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 100), original_amount numeric(19,2) not null check(original_amount>=0),
  balance numeric(19,2) not null check(balance>=0), apr numeric(7,4) check(apr>=0 and apr<=1000), minimum_payment numeric(19,2) check(minimum_payment>=0),
  notes text not null default '', color text not null default '#f43f5e', is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.budgets (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, budgeted numeric(19,2) not null default 0 check(budgeted>=0), spent numeric(19,2) not null default 0 check(spent>=0),
  category text not null default '', is_demo boolean not null default false, created_at timestamptz not null default now(), unique(id,user_id)
);
create table public.goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, target numeric(19,2) not null default 0 check(target>=0), saved numeric(19,2) not null default 0 check(saved>=0), deadline date,
  description text not null default '', category text not null default '', notes text not null default '', is_demo boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id)
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check(type in ('income','expense','transfer')), amount numeric(19,2) not null check(amount>0),
  account_id uuid not null, to_account_id uuid, category text not null default '', description text not null default '', transaction_date date not null,
  currency text not null default 'INR' check(currency ~ '^[A-Z]{3}$'), income_stream_id uuid, notes text not null default '', is_demo boolean not null default false,
  created_at timestamptz not null default now(), unique(id,user_id),
  foreign key(account_id,user_id) references public.accounts(id,user_id), foreign key(to_account_id,user_id) references public.accounts(id,user_id),
  foreign key(income_stream_id,user_id) references public.incomes(id,user_id)
);
create table public.debt_payments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  debt_id uuid not null, transaction_id uuid not null, amount numeric(19,2) not null check(amount>0), principal_amount numeric(19,2), interest_amount numeric(19,2),
  payment_date date not null, notes text, is_demo boolean not null default false, created_at timestamptz not null default now(), unique(id,user_id), unique(transaction_id),
  foreign key(debt_id,user_id) references public.debts(id,user_id), foreign key(transaction_id,user_id) references public.transactions(id,user_id)
);

create index on public.accounts(user_id); create index on public.transactions(user_id,transaction_date desc);
create index on public.debts(user_id); create index on public.incomes(user_id); create index on public.goals(user_id);
create index on public.budgets(user_id); create index on public.debt_payments(user_id,debt_id,payment_date desc);

alter table public.profiles enable row level security; alter table public.user_preferences enable row level security;
alter table public.accounts enable row level security; alter table public.transactions enable row level security;
alter table public.debts enable row level security; alter table public.incomes enable row level security;
alter table public.goals enable row level security; alter table public.budgets enable row level security; alter table public.debt_payments enable row level security;

revoke all on all tables in schema public from anon; grant select,insert,update,delete on all tables in schema public to authenticated;

do $$ declare t text; key_column text; begin
  foreach t in array array['accounts','transactions','debts','incomes','goals','budgets','debt_payments','user_preferences'] loop
    key_column := case when t='user_preferences' then 'user_id' else 'user_id' end;
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = %I)',t||'_select_own',t,key_column);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = %I)',t||'_insert_own',t,key_column);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = %I) with check ((select auth.uid()) = %I)',t||'_update_own',t,key_column,key_column);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = %I)',t||'_delete_own',t,key_column);
  end loop;
end $$;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);

create or replace function private.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1),'User'));
  insert into public.user_preferences(user_id) values(new.id); return new;
end $$;
revoke all on function private.handle_new_user() from public,anon,authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function public.record_debt_payment(p_debt_id uuid,p_account_id uuid,p_amount numeric,p_payment_date date,p_notes text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare uid uuid := auth.uid(); d public.debts; a public.accounts; tx public.transactions; pay public.debt_payments;
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) then raise exception 'invalid_amount'; end if;
  select * into d from public.debts where id=p_debt_id and user_id=uid for update;
  if not found then raise exception 'debt_not_found' using errcode='P0002'; end if;
  select * into a from public.accounts where id=p_account_id and user_id=uid for update;
  if not found then raise exception 'account_not_found' using errcode='P0002'; end if;
  if p_amount>d.balance then raise exception 'payment_exceeds_balance'; end if;
  insert into public.transactions(user_id,type,amount,account_id,category,description,transaction_date,currency,notes,is_demo)
  values(uid,'expense',p_amount,a.id,'Debt Payment','Payment · '||d.name,p_payment_date,a.currency,coalesce(p_notes,''),d.is_demo)
  returning * into tx;
  update public.debts set balance=balance-p_amount,updated_at=now() where id=d.id and user_id=uid returning * into d;
  insert into public.debt_payments(user_id,debt_id,transaction_id,amount,principal_amount,payment_date,notes,is_demo)
  values(uid,d.id,tx.id,p_amount,p_amount,p_payment_date,p_notes,d.is_demo) returning * into pay;
  return jsonb_build_object('debt',to_jsonb(d),'transaction',to_jsonb(tx),'payment',to_jsonb(pay),
    'freedom_number',(select coalesce(sum(balance),0) from public.debts where user_id=uid));
end $$;
revoke all on function public.record_debt_payment(uuid,uuid,numeric,date,text) from public,anon;
grant execute on function public.record_debt_payment(uuid,uuid,numeric,date,text) to authenticated;
