-- Corrective deployment only. Do not replay historical migrations or receivables.
-- Applies no customer-data DML and replaces no functions or RLS policies.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';

do $preconditions$
begin
  if exists (select 1 from public.ai_conversations where char_length(title) not between 1 and 120)
    or exists (select 1 from public.ai_messages where char_length(content) not between 1 and 12000)
    or exists (select 1 from public.ai_usage where request_count < 0) then
    raise exception 'AI constraint violations exist; correction aborted';
  end if;
end
$preconditions$;

do $constraints$
begin
  if not exists (select 1 from pg_catalog.pg_constraint where conrelid='public.ai_conversations'::regclass and conname='ai_conversations_title_check') then
    alter table public.ai_conversations add constraint ai_conversations_title_check check (char_length(title) between 1 and 120) not valid;
  elsif not exists (select 1 from pg_catalog.pg_constraint where conrelid='public.ai_conversations'::regclass and conname='ai_conversations_title_check' and contype='c' and pg_catalog.pg_get_constraintdef(oid) in ('CHECK (((char_length(title) >= 1) AND (char_length(title) <= 120)))','CHECK (((char_length(title) >= 1) AND (char_length(title) <= 120))) NOT VALID')) then
    raise exception 'Existing ai_conversations_title_check differs; correction aborted';
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conrelid='public.ai_messages'::regclass and conname='ai_messages_content_check') then
    alter table public.ai_messages add constraint ai_messages_content_check check (char_length(content) between 1 and 12000) not valid;
  elsif not exists (select 1 from pg_catalog.pg_constraint where conrelid='public.ai_messages'::regclass and conname='ai_messages_content_check' and contype='c' and pg_catalog.pg_get_constraintdef(oid) in ('CHECK (((char_length(content) >= 1) AND (char_length(content) <= 12000)))','CHECK (((char_length(content) >= 1) AND (char_length(content) <= 12000))) NOT VALID')) then
    raise exception 'Existing ai_messages_content_check differs; correction aborted';
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conrelid='public.ai_usage'::regclass and conname='ai_usage_request_count_check') then
    alter table public.ai_usage add constraint ai_usage_request_count_check check (request_count >= 0) not valid;
  elsif not exists (select 1 from pg_catalog.pg_constraint where conrelid='public.ai_usage'::regclass and conname='ai_usage_request_count_check' and contype='c' and pg_catalog.pg_get_constraintdef(oid) in ('CHECK ((request_count >= 0))','CHECK ((request_count >= 0)) NOT VALID')) then
    raise exception 'Existing ai_usage_request_count_check differs; correction aborted';
  end if;
end
$constraints$;

alter table public.ai_conversations validate constraint ai_conversations_title_check;
alter table public.ai_messages validate constraint ai_messages_content_check;
alter table public.ai_usage validate constraint ai_usage_request_count_check;

-- Row-level app operations never need table-wide or schema-maintenance privileges.
-- This changes ACL only, including on financial tables; no rows/balances are changed.
revoke truncate, references, trigger, maintain on table
  public.accounts, public.ai_conversations, public.ai_messages, public.ai_usage,
  public.budgets, public.debt_payments, public.debts, public.goals, public.incomes,
  public.profiles, public.telegram_connections, public.telegram_drafts,
  public.telegram_link_tokens, public.telegram_updates, public.transactions,
  public.user_preferences
from anon, authenticated, public;

-- All AI routes require an authenticated user. No anonymous AI table access is used.
revoke select, insert, update, delete on table
  public.ai_conversations, public.ai_messages, public.ai_usage
from anon, public;

-- Usage is read/upserted; deletion would let an owner reset their monthly quota.
-- Preserve SELECT/INSERT/UPDATE and service_role/postgres operational privileges.
revoke delete on table public.ai_usage from authenticated, public;

commit;
