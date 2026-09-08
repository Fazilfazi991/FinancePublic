-- Owner administration and privacy-safe analytics.
-- Apply with `supabase db push`; never run schema creation from an HTTP route.

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists role text not null default 'user',
  add column if not exists status text not null default 'active',
  add column if not exists plan text not null default 'free',
  add column if not exists email_verified_at timestamptz,
  add column if not exists last_sign_in_at timestamptz,
  add column if not exists last_active_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_role_check,
  add constraint profiles_role_check check (role in ('user','admin','super_admin')),
  drop constraint if exists profiles_status_check,
  add constraint profiles_status_check check (status in ('active','suspended','pending','deleted')),
  drop constraint if exists profiles_plan_check,
  add constraint profiles_plan_check check (plan in ('free','premium'));

update public.profiles p set
  full_name = coalesce(p.full_name, p.display_name),
  email = coalesce(p.email, u.email),
  email_verified_at = coalesce(p.email_verified_at, u.email_confirmed_at),
  last_sign_in_at = coalesce(p.last_sign_in_at, u.last_sign_in_at)
from auth.users u where u.id = p.id;

create unique index if not exists profiles_email_unique on public.profiles (lower(email)) where email is not null and deleted_at is null;
create index if not exists profiles_admin_list_idx on public.profiles (created_at desc, id);
create index if not exists profiles_status_plan_idx on public.profiles (status, plan, created_at desc);

create or replace function private.protect_profile_privileges() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and auth.uid() = old.id and
    (new.role, new.status, new.plan, new.deleted_at) is distinct from
    (old.role, old.status, old.plan, old.deleted_at) then
    raise exception 'profile_privileged_fields_forbidden' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke all on function private.protect_profile_privileges() from public, anon, authenticated;
drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges before update on public.profiles
for each row execute function private.protect_profile_privileges();

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, full_name, email, role, status, plan, email_verified_at, last_sign_in_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1), 'User'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1), 'User'),
    new.email,
    'user',
    case when new.email_confirmed_at is null then 'pending' else 'active' end,
    'free',
    new.email_confirmed_at,
    new.last_sign_in_at
  );
  insert into public.user_preferences(user_id) values(new.id);
  return new;
end $$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  session_id text,
  event_name text not null,
  page_path text,
  source text not null default 'app',
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (user_id is not null or anonymous_id is not null),
  check (jsonb_typeof(metadata) = 'object'),
  check (octet_length(metadata::text) <= 4096)
);
create index if not exists app_events_user_occurred_idx on public.app_events(user_id, occurred_at desc);
create index if not exists app_events_name_occurred_idx on public.app_events(event_name, occurred_at desc);
create index if not exists app_events_occurred_idx on public.app_events(occurred_at desc);
create index if not exists app_events_session_idx on public.app_events(session_id) where session_id is not null;
create unique index if not exists app_events_idempotency_idx on public.app_events(coalesce(user_id::text, anonymous_id), idempotency_key) where idempotency_key is not null;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id),
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (octet_length(metadata::text) <= 8192)
);
create index if not exists admin_audit_created_idx on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_actor_idx on public.admin_audit_log(actor_user_id, created_at desc);

create table if not exists public.analytics_sync_runs (
  id uuid primary key default gen_random_uuid(), provider text not null check(provider in ('ga4','search_console')),
  status text not null check(status in ('running','succeeded','failed')), started_at timestamptz not null default now(),
  completed_at timestamptz, error_summary text, records_processed integer not null default 0,
  idempotency_key text unique
);
create index if not exists analytics_sync_provider_idx on public.analytics_sync_runs(provider, started_at desc);

create table if not exists public.analytics_daily_snapshots (
  provider text not null check(provider in ('ga4','search_console')), metric_date date not null,
  dimension_type text not null default 'summary', dimension_value text not null default '',
  metrics jsonb not null default '{}'::jsonb, synced_at timestamptz not null default now(),
  primary key(provider, metric_date, dimension_type, dimension_value),
  check (jsonb_typeof(metrics) = 'object'), check (octet_length(metrics::text) <= 16384)
);
create index if not exists analytics_snapshots_date_idx on public.analytics_daily_snapshots(provider, metric_date desc);

alter table public.app_events enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.analytics_sync_runs enable row level security;
alter table public.analytics_daily_snapshots enable row level security;
revoke all on public.app_events, public.admin_audit_log, public.analytics_sync_runs, public.analytics_daily_snapshots from anon, authenticated;

-- Bootstrap the first owner out-of-band with the service role or SQL editor:
-- update public.profiles set role = 'super_admin' where id = '<verified auth user uuid>';
