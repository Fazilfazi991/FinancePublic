alter table public.transactions
  add column source text not null default 'manual' check (source in ('manual','quick_entry','telegram','debt_payment','demo')),
  add column idempotency_key uuid;

create unique index transactions_user_idempotency
  on public.transactions(user_id,idempotency_key)
  where idempotency_key is not null;
