begin;

create or replace function public.update_owned_transaction(
  p_transaction_id uuid, p_type text, p_amount numeric, p_account_id uuid,
  p_to_account_id uuid, p_category text, p_description text, p_transaction_date date,
  p_currency text, p_income_stream_id uuid default null, p_notes text default ''
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $update_owned_transaction$
declare uid uuid := auth.uid(); old_tx public.transactions; changed_tx public.transactions; payment public.debt_payments; debt public.debts; next_balance numeric; old_principal numeric; new_principal numeric;
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  if p_amount is null or p_amount::text in ('NaN','Infinity','-Infinity') or p_amount <= 0 or p_amount <> round(p_amount,2) then raise exception 'invalid_amount'; end if;
  if p_type is null or p_type not in ('income','expense','transfer') then raise exception 'invalid_type'; end if;
  if p_account_id is null or p_category is null or char_length(trim(p_category)) not between 1 and 80 or char_length(coalesce(p_description,'')) > 200 or char_length(coalesce(p_notes,'')) > 500 or p_transaction_date is null or p_currency is null or p_currency !~ '^[A-Z]{3}$' then raise exception 'invalid_transaction_details'; end if;
  if (p_type='transfer' and (p_to_account_id is null or p_to_account_id=p_account_id)) or (p_type<>'transfer' and p_to_account_id is not null) then raise exception 'invalid_transfer'; end if;
  select * into old_tx from public.transactions where id=p_transaction_id and user_id=uid for update;
  if not found then raise exception 'transaction_not_found' using errcode='P0002'; end if;
  perform 1 from public.accounts where id=p_account_id and user_id=uid and currency=p_currency;
  if not found then raise exception 'account_not_found' using errcode='P0002'; end if;
  if p_to_account_id is not null then perform 1 from public.accounts where id=p_to_account_id and user_id=uid and currency=p_currency; if not found then raise exception 'destination_not_found' using errcode='P0002'; end if; end if;
  if p_income_stream_id is not null then perform 1 from public.incomes where id=p_income_stream_id and user_id=uid; if not found then raise exception 'income_source_not_found' using errcode='P0002'; end if; end if;
  select * into payment from public.debt_payments where transaction_id=old_tx.id and user_id=uid for update;
  if found then
    if p_type<>'expense' or p_category<>'Debt Payment' then raise exception 'linked_debt_payment'; end if;
    select * into debt from public.debts where id=payment.debt_id and user_id=uid for update;
    if not found then raise exception 'linked_debt_not_found' using errcode='P0002'; end if;
    old_principal := coalesce(payment.principal_amount,payment.amount);
    new_principal := p_amount - coalesce(payment.interest_amount,0);
    next_balance := debt.balance + old_principal - new_principal;
    if new_principal < 0 or next_balance < 0 or next_balance > debt.original_amount then raise exception 'invalid_debt_payment_amount'; end if;
    update public.debts set balance=next_balance,updated_at=now() where id=debt.id and user_id=uid returning * into debt;
    update public.debt_payments set amount=p_amount,principal_amount=new_principal,payment_date=p_transaction_date,notes=p_notes where id=payment.id and user_id=uid;
  end if;
  update public.transactions set type=p_type,amount=p_amount,account_id=p_account_id,to_account_id=p_to_account_id,
    category=case when p_type='transfer' then 'Transfer' else trim(p_category) end,description=coalesce(trim(p_description),''),transaction_date=p_transaction_date,currency=p_currency,
    income_stream_id=case when p_type='income' then p_income_stream_id else null end,notes=coalesce(p_notes,'')
    where id=old_tx.id and user_id=uid returning * into changed_tx;
  return jsonb_build_object('transaction',to_jsonb(changed_tx),'debt',case when payment.id is null then null else to_jsonb(debt) end);
end;
$update_owned_transaction$;

create or replace function public.delete_owned_transaction(p_transaction_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $delete_owned_transaction$
declare uid uuid := auth.uid(); tx public.transactions; payment public.debt_payments; debt public.debts; restored_balance numeric;
begin
  if uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
  select * into tx from public.transactions where id=p_transaction_id and user_id=uid for update;
  if not found then raise exception 'transaction_not_found' using errcode='P0002'; end if;
  select * into payment from public.debt_payments where transaction_id=tx.id and user_id=uid for update;
  if found then
    select * into debt from public.debts where id=payment.debt_id and user_id=uid for update;
    if not found then raise exception 'linked_debt_not_found' using errcode='P0002'; end if;
    restored_balance := debt.balance + coalesce(payment.principal_amount,payment.amount);
    if restored_balance > debt.original_amount then raise exception 'invalid_debt_payment_reversal'; end if;
    update public.debts set balance=restored_balance,updated_at=now() where id=debt.id and user_id=uid returning * into debt;
    delete from public.debt_payments where id=payment.id and user_id=uid;
  end if;
  delete from public.transactions where id=tx.id and user_id=uid;
  return jsonb_build_object('debt',case when payment.id is null then null else to_jsonb(debt) end);
end;
$delete_owned_transaction$;

revoke all on function public.update_owned_transaction(uuid,text,numeric,uuid,uuid,text,text,date,text,uuid,text) from public,anon,authenticated;
grant execute on function public.update_owned_transaction(uuid,text,numeric,uuid,uuid,text,text,date,text,uuid,text) to authenticated;
revoke all on function public.delete_owned_transaction(uuid) from public,anon,authenticated;
grant execute on function public.delete_owned_transaction(uuid) to authenticated;

commit;
