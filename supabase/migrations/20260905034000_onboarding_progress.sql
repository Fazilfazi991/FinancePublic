alter table public.profiles
  add column if not exists onboarding_step smallint not null default 1 check (onboarding_step between 1 and 5),
  add column if not exists onboarding_debt_completed boolean not null default false,
  add column if not exists onboarding_income_completed boolean not null default false,
  add column if not exists onboarding_expenses_completed boolean not null default false,
  add column if not exists onboarding_payoff_seen boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz;
