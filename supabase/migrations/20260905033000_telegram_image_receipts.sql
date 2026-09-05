alter table public.transactions drop constraint if exists transactions_source_check;
alter table public.transactions add constraint transactions_source_check check(source in ('manual','quick_entry','telegram','telegram_image','debt_payment','demo'));

create table public.telegram_image_receipts(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 telegram_user_id bigint not null, telegram_file_unique_id text not null, content_hash text not null,
 reference_hash text, draft_id uuid references public.telegram_drafts(id) on delete set null,
 status text not null check(status in ('processing','drafted','rejected','failed','duplicate')),
 ocr_line_count integer, processing_ms integer, created_at timestamptz not null default now()
);
create unique index telegram_image_file_unique on public.telegram_image_receipts(user_id,telegram_file_unique_id);
create unique index telegram_image_content_unique on public.telegram_image_receipts(user_id,content_hash);
create unique index telegram_image_reference_unique on public.telegram_image_receipts(user_id,reference_hash) where reference_hash is not null and status='drafted';
create index telegram_image_rate on public.telegram_image_receipts(telegram_user_id,created_at desc);
alter table public.telegram_image_receipts enable row level security;
revoke all on public.telegram_image_receipts from anon,authenticated;
