create or replace function public.load_demo_workspace(p_reset boolean default false) returns void language plpgsql security invoker set search_path='' as $$
declare
  uid uuid := auth.uid();
  aid uuid;
  base text;
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select base_currency into base from public.profiles where id=uid;
  if base is null or base not in ('INR','USD','AED','EUR') then raise exception 'base_currency_required'; end if;
  if p_reset then perform public.remove_demo_workspace(); end if;
  if exists(select 1 from public.accounts where user_id=uid and not is_demo)
    or exists(select 1 from public.debts where user_id=uid and not is_demo)
    or exists(select 1 from public.transactions where user_id=uid and not is_demo)
    or exists(select 1 from public.incomes where user_id=uid and not is_demo)
    or exists(select 1 from public.goals where user_id=uid and not is_demo)
    or exists(select 1 from public.budgets where user_id=uid and not is_demo)
  then raise exception 'workspace_not_empty'; end if;
  if exists(select 1 from public.accounts where user_id=uid and is_demo) then raise exception 'demo_already_loaded'; end if;

  insert into public.accounts(user_id,name,institution,type,currency,opening_balance,color,is_default,is_demo)
  values(uid,'Main Bank','Sample Bank','current',base,79000,'#10b981',true,true) returning id into aid;
  insert into public.accounts(user_id,name,institution,type,currency,opening_balance,color,is_demo) values
    (uid,'Savings','Sample Bank','savings',base,120000,'#38bdf8',true),
    (uid,'Cash','Wallet','cash',base,12500,'#f59e0b',true);
  insert into public.debts(user_id,name,original_amount,balance,apr,minimum_payment,color,notes,is_demo) values
    (uid,'Credit Card',120000,58000,18.9,5000,'#f43f5e','Fictional sample debt',true),
    (uid,'Personal Loan',600000,440000,10.5,18000,'#f59e0b','Fictional sample debt',true),
    (uid,'Gold Loan',300000,210000,11.5,10000,'#eab308','Fictional sample debt',true),
    (uid,'Education Loan',500000,360000,8.25,12000,'#8b5cf6','Fictional sample debt',true);
  insert into public.incomes(user_id,name,type,status,currency,expected_monthly,actual_this_month,color,icon,linked_account_id,notes,is_demo)
  values(uid,'Monthly Income','Business','active',base,145000,145000,'#10b981','briefcase',aid,'Fictional sample income',true);
  insert into public.budgets(user_id,name,budgeted,spent,category,is_demo) values
    (uid,'Housing',25000,25000,'Housing',true),(uid,'Food',12000,12000,'Food & Dining',true),
    (uid,'Transport',8000,8000,'Transport',true),(uid,'Utilities',6000,6000,'Utilities',true),
    (uid,'Other living costs',12000,12000,'Other',true);
end $$;

revoke all on function public.load_demo_workspace(boolean) from public,anon;
grant execute on function public.load_demo_workspace(boolean) to authenticated;
