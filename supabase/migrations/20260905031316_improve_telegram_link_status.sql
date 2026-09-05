create or replace function public.consume_telegram_link_token(
  p_token_hash text,
  p_telegram_user_id bigint,
  p_telegram_chat_id bigint,
  p_telegram_username text default null
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  link public.telegram_link_tokens;
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into link
  from public.telegram_link_tokens
  where token_hash = p_token_hash
  for update;

  if not found or link.used_at is not null then
    return 'invalid';
  end if;
  if link.expires_at <= now() then
    return 'expired';
  end if;

  update public.telegram_link_tokens set used_at = now() where id = link.id;
  if exists(
    select 1 from public.telegram_connections
    where revoked_at is null
      and (user_id = link.user_id or telegram_user_id = p_telegram_user_id)
  ) then
    return 'already_linked';
  end if;

  insert into public.telegram_connections(user_id,telegram_user_id,telegram_chat_id,telegram_username)
  values(link.user_id,p_telegram_user_id,p_telegram_chat_id,left(p_telegram_username,100));
  return 'linked';
end
$$;

revoke all on function public.consume_telegram_link_token(text,bigint,bigint,text) from public,anon,authenticated;
grant execute on function public.consume_telegram_link_token(text,bigint,bigint,text) to service_role;
