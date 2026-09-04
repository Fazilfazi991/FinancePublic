alter table public.debt_payments add column idempotency_key uuid;
create unique index debt_payments_user_idempotency on public.debt_payments(user_id,idempotency_key) where idempotency_key is not null;

drop function public.record_debt_payment(uuid,uuid,numeric,date,text);
create function public.record_debt_payment(p_debt_id uuid,p_account_id uuid,p_amount numeric,p_payment_date date,p_notes text default null,p_idempotency_key uuid default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); d public.debts; a public.accounts; tx public.transactions; pay public.debt_payments;
begin
 if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
 if p_idempotency_key is not null then select * into pay from public.debt_payments where user_id=uid and idempotency_key=p_idempotency_key;
  if found then select * into d from public.debts where id=pay.debt_id and user_id=uid; select * into tx from public.transactions where id=pay.transaction_id and user_id=uid;
   return jsonb_build_object('debt',to_jsonb(d),'transaction',to_jsonb(tx),'payment',to_jsonb(pay),'freedom_number',(select coalesce(sum(balance),0) from public.debts where user_id=uid)); end if; end if;
 if p_amount is null or p_amount<=0 or p_amount<>round(p_amount,2) then raise exception 'invalid_amount'; end if;
 select * into d from public.debts where id=p_debt_id and user_id=uid for update;
 if not found then raise exception 'debt_not_found' using errcode='P0002'; end if;
 select * into a from public.accounts where id=p_account_id and user_id=uid for update;
 if not found then raise exception 'account_not_found' using errcode='P0002'; end if;
 if p_amount>d.balance then raise exception 'payment_exceeds_balance'; end if;
 insert into public.transactions(user_id,type,amount,account_id,category,description,transaction_date,currency,notes,is_demo)
 values(uid,'expense',p_amount,a.id,'Debt Payment','Payment · '||d.name,p_payment_date,a.currency,coalesce(p_notes,''),d.is_demo) returning * into tx;
 update public.debts set balance=balance-p_amount,updated_at=now() where id=d.id and user_id=uid returning * into d;
 insert into public.debt_payments(user_id,debt_id,transaction_id,amount,principal_amount,payment_date,notes,is_demo,idempotency_key)
 values(uid,d.id,tx.id,p_amount,p_amount,p_payment_date,p_notes,d.is_demo,p_idempotency_key) returning * into pay;
 return jsonb_build_object('debt',to_jsonb(d),'transaction',to_jsonb(tx),'payment',to_jsonb(pay),'freedom_number',(select coalesce(sum(balance),0) from public.debts where user_id=uid));
end $$;
revoke all on function public.record_debt_payment(uuid,uuid,numeric,date,text,uuid) from public,anon;
grant execute on function public.record_debt_payment(uuid,uuid,numeric,date,text,uuid) to authenticated;

create function public.remove_demo_workspace() returns void language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); begin if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
 delete from public.debt_payments where user_id=uid and is_demo; delete from public.transactions where user_id=uid and is_demo;
 delete from public.debts where user_id=uid and is_demo; delete from public.incomes where user_id=uid and is_demo;
 delete from public.goals where user_id=uid and is_demo; delete from public.budgets where user_id=uid and is_demo;
 delete from public.accounts where user_id=uid and is_demo; end $$;
revoke all on function public.remove_demo_workspace() from public,anon; grant execute on function public.remove_demo_workspace() to authenticated;

create function public.load_demo_workspace(p_reset boolean default false) returns void language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); aid uuid; begin if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
 if p_reset then perform public.remove_demo_workspace(); end if;
 if exists(select 1 from public.accounts where user_id=uid and not is_demo) or exists(select 1 from public.debts where user_id=uid and not is_demo)
  or exists(select 1 from public.transactions where user_id=uid and not is_demo) or exists(select 1 from public.incomes where user_id=uid and not is_demo)
  or exists(select 1 from public.goals where user_id=uid and not is_demo) or exists(select 1 from public.budgets where user_id=uid and not is_demo)
 then raise exception 'workspace_not_empty'; end if;
 if exists(select 1 from public.accounts where user_id=uid and is_demo) then raise exception 'demo_already_loaded'; end if;
 insert into public.accounts(user_id,name,institution,type,currency,opening_balance,color,is_default,is_demo) values(uid,'Main Bank','Sample Bank','current','INR',79000,'#10b981',true,true) returning id into aid;
 insert into public.accounts(user_id,name,institution,type,currency,opening_balance,color,is_demo) values(uid,'Savings','Sample Bank','savings','INR',120000,'#38bdf8',true),(uid,'Cash','Wallet','cash','INR',12500,'#f59e0b',true);
 insert into public.debts(user_id,name,original_amount,balance,apr,minimum_payment,color,notes,is_demo) values
 (uid,'Credit Card',120000,58000,18.9,5000,'#f43f5e','Fictional sample debt',true),(uid,'Personal Loan',600000,440000,10.5,18000,'#f59e0b','Fictional sample debt',true),
 (uid,'Gold Loan',300000,210000,11.5,10000,'#eab308','Fictional sample debt',true),(uid,'Education Loan',500000,360000,8.25,12000,'#8b5cf6','Fictional sample debt',true);
 insert into public.incomes(user_id,name,type,status,currency,expected_monthly,actual_this_month,color,icon,linked_account_id,notes,is_demo)
 values(uid,'Monthly Income','Business','active','INR',145000,145000,'#10b981','briefcase',aid,'Fictional sample income',true);
 insert into public.budgets(user_id,name,budgeted,spent,category,is_demo) values(uid,'Housing',25000,25000,'Housing',true),(uid,'Food',12000,12000,'Food & Dining',true),(uid,'Transport',8000,8000,'Transport',true),(uid,'Utilities',6000,6000,'Utilities',true),(uid,'Other living costs',12000,12000,'Other',true);
end $$;
revoke all on function public.load_demo_workspace(boolean) from public,anon; grant execute on function public.load_demo_workspace(boolean) to authenticated;
