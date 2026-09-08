-- Bounded, service-role-only aggregate reporting for the Owner Admin dashboard.
create index if not exists app_events_engagement_user_time_idx
  on public.app_events (user_id, occurred_at desc, event_name)
  where user_id is not null and event_name in (
    'login_completed','onboarding_completed','account_created','transaction_created',
    'debt_created','debt_payment_added','goal_created','goal_contribution_added',
    'budget_created','ai_advisor_opened','ai_advisor_message_sent'
  );
create index if not exists profiles_created_verified_idx on public.profiles(created_at, email_verified_at) where deleted_at is null;

create or replace function public.admin_analytics_report(p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_from is null or p_to is null or p_from > p_to or p_to - p_from > 730 then
    raise exception 'invalid_analytics_range';
  end if;
  with bounds as (
    select p_from::timestamptz as from_ts,(p_to+1)::timestamptz as to_ts,
      (p_from-(p_to-p_from+1))::timestamptz as previous_from_ts,p_from::timestamptz as previous_to_ts
  ), qualifying as (
    select user_id,event_name,occurred_at from public.app_events
    where user_id is not null and event_name in ('login_completed','onboarding_completed','account_created','transaction_created','debt_created','debt_payment_added','goal_created','goal_contribution_added','budget_created','ai_advisor_opened','ai_advisor_message_sent')
  ), registration as (
    select
      count(*) filter(where p.created_at>=b.from_ts and p.created_at<b.to_ts)::int current,
      count(*) filter(where p.created_at>=b.previous_from_ts and p.created_at<b.previous_to_ts)::int previous,
      count(*) filter(where p.created_at>=date_trunc('day',now() at time zone 'UTC'))::int today,
      count(*) filter(where p.created_at>=date_trunc('day',now() at time zone 'UTC')-interval '1 day' and p.created_at<date_trunc('day',now() at time zone 'UTC'))::int yesterday,
      count(*) filter(where p.created_at>=date_trunc('day',now() at time zone 'UTC')-interval '6 days')::int last7,
      count(*) filter(where p.created_at>=date_trunc('day',now() at time zone 'UTC')-interval '29 days')::int last30,
      count(*) filter(where p.created_at>=b.from_ts and p.created_at<b.to_ts and p.email_verified_at is not null)::int verified,
      count(*) filter(where p.created_at>=b.from_ts and p.created_at<b.to_ts and p.email_verified_at is null)::int unverified,
      count(*) filter(where p.created_at>=b.from_ts and p.created_at<b.to_ts and p.onboarding_completed)::int onboarded,
      count(*)::int total,count(*) filter(where p.email_verified_at is not null)::int total_verified,
      count(*) filter(where p.plan='premium')::int total_premium
    from public.profiles p cross join bounds b where p.deleted_at is null
  ), active as (
    select
      count(distinct user_id) filter(where occurred_at>=date_trunc('day',now() at time zone 'UTC') and occurred_at<date_trunc('day',now() at time zone 'UTC')+interval '1 day')::int dau,
      count(distinct user_id) filter(where occurred_at>=date_trunc('day',now() at time zone 'UTC')-interval '6 days')::int wau,
      count(distinct user_id) filter(where occurred_at>=date_trunc('day',now() at time zone 'UTC')-interval '29 days')::int mau,
      count(distinct user_id) filter(where occurred_at>=b.from_ts and occurred_at<b.to_ts)::int selected,
      count(distinct user_id) filter(where occurred_at>=b.previous_from_ts and occurred_at<b.previous_to_ts)::int previous_selected
    from qualifying cross join bounds b
  ), registration_trend as (
    select jsonb_agg(jsonb_build_object('date',d::date,'registered',coalesce(x.registered,0),'verified',coalesce(x.verified,0),'total',coalesce(x.total,0),'totalVerified',coalesce(x.total_verified,0),'premium',coalesce(x.premium,0)) order by d) value
    from generate_series(p_from,p_to,interval '1 day') d left join lateral (
      select count(*) filter(where created_at>=d and created_at<d+interval '1 day')::int registered,
        count(*) filter(where created_at>=d and created_at<d+interval '1 day' and email_verified_at is not null)::int verified,
        count(*) filter(where created_at<d+interval '1 day')::int total,
        count(*) filter(where created_at<d+interval '1 day' and email_verified_at is not null)::int total_verified,
        count(*) filter(where created_at<d+interval '1 day' and plan='premium')::int premium
      from public.profiles where deleted_at is null
    )x on true
  ), active_trend as (
    select jsonb_agg(jsonb_build_object('date',d::date,'users',coalesce(x.users,0)) order by d)value
    from generate_series(greatest(p_to-29,p_from),p_to,interval '1 day')d left join lateral(
      select count(distinct user_id)::int users from qualifying where occurred_at>=d and occurred_at<d+interval '1 day'
    )x on true
  ), feature_names as (
    select * from (values
      ('Financial accounts',array['account_created']::text[]),('Transactions',array['transaction_created']),('Debts',array['debt_created']),
      ('Debt payments',array['debt_payment_added']),('Goals',array['goal_created']),('Goal contributions',array['goal_contribution_added']),
      ('Budgets',array['budget_created']),('AI advisor',array['ai_advisor_opened','ai_advisor_message_sent'])
    )v(label,event_names)
  ), feature_adoption as (
    select jsonb_agg(jsonb_build_object('feature',f.label,'users',coalesce(c.users,0),'actions',coalesce(c.actions,0),'previousUsers',coalesce(c.previous_users,0),'previousActions',coalesce(c.previous_actions,0)) order by coalesce(c.users,0) desc) value
    from feature_names f cross join bounds b left join lateral(
      select count(distinct user_id) filter(where occurred_at>=b.from_ts and occurred_at<b.to_ts)::int users,
        count(*) filter(where occurred_at>=b.from_ts and occurred_at<b.to_ts)::int actions,
        count(distinct user_id) filter(where occurred_at>=b.previous_from_ts and occurred_at<b.previous_to_ts)::int previous_users,
        count(*) filter(where occurred_at>=b.previous_from_ts and occurred_at<b.previous_to_ts)::int previous_actions
      from qualifying where event_name=any(f.event_names)
    )c on true
  ), funnel_counts as (
    select
      greatest((select count(distinct coalesce(user_id::text,anonymous_id)) from public.app_events e,bounds b where event_name='signup_started' and occurred_at>=b.from_ts and occurred_at<b.to_ts),(select current from registration))::int signup_started,
      (select current from registration)::int signup_completed,(select verified from registration)::int email_verified,
      greatest((select count(distinct q.user_id) from qualifying q,bounds b where q.event_name='login_completed' and q.occurred_at>=b.from_ts and q.occurred_at<b.to_ts),(select count(*) from public.profiles p,bounds b where p.created_at>=b.from_ts and p.created_at<b.to_ts and p.last_sign_in_at is not null))::int first_login,
      (select onboarded from registration)::int onboarding_completed,
      (select count(distinct a.user_id) from public.accounts a join public.profiles p on p.id=a.user_id cross join bounds b where p.created_at>=b.from_ts and p.created_at<b.to_ts)::int first_account,
      (select count(distinct user_id) from (select t.user_id from public.transactions t join public.profiles p on p.id=t.user_id cross join bounds b where p.created_at>=b.from_ts and p.created_at<b.to_ts union select d.user_id from public.debts d join public.profiles p on p.id=d.user_id cross join bounds b where p.created_at>=b.from_ts and p.created_at<b.to_ts union select g.user_id from public.goals g join public.profiles p on p.id=g.user_id cross join bounds b where p.created_at>=b.from_ts and p.created_at<b.to_ts)s)::int first_financial_object
  ), funnel as (
    select jsonb_agg(jsonb_build_object('key',key,'label',label,'users',users) order by ordinal)value from funnel_counts f cross join lateral(values
      (1,'signup_started','Signup started',f.signup_started),(2,'signup_completed','Signup completed',f.signup_completed),(3,'email_verified','Email verified',f.email_verified),(4,'first_login','First login',f.first_login),(5,'onboarding_completed','Onboarding completed',f.onboarding_completed),(6,'first_account','First financial account',f.first_account),(7,'first_financial_object','First transaction, debt, or goal',f.first_financial_object)
    )s(ordinal,key,label,users)
  ), recent as (
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb)value from(select id,full_name,email,created_at,email_verified_at,plan,status from public.profiles where deleted_at is null order by created_at desc limit 10)x
  ), retention as (
    select coalesce(jsonb_agg(jsonb_build_object('cohort',c.cohort,'users',c.users,'d1',c.d1,'d7',c.d7,'d14',c.d14,'d30',c.d30,'d1Measurable',current_date>=c.cohort+7+1,'d7Measurable',current_date>=c.cohort+7+7,'d14Measurable',current_date>=c.cohort+7+14,'d30Measurable',current_date>=c.cohort+7+30) order by c.cohort desc),'[]'::jsonb)value
    from(select date_trunc('week',p.created_at)::date cohort,count(*)::int users,
      round(100.0*count(*) filter(where exists(select 1 from qualifying q where q.user_id=p.id and q.occurred_at>=p.created_at+interval '1 day'))/nullif(count(*),0),1)d1,
      round(100.0*count(*) filter(where exists(select 1 from qualifying q where q.user_id=p.id and q.occurred_at>=p.created_at+interval '7 days'))/nullif(count(*),0),1)d7,
      round(100.0*count(*) filter(where exists(select 1 from qualifying q where q.user_id=p.id and q.occurred_at>=p.created_at+interval '14 days'))/nullif(count(*),0),1)d14,
      round(100.0*count(*) filter(where exists(select 1 from qualifying q where q.user_id=p.id and q.occurred_at>=p.created_at+interval '30 days'))/nullif(count(*),0),1)d30
      from public.profiles p where p.created_at>=p_from and p.created_at<(p_to+1) and p.deleted_at is null group by 1)c
  ), first_party as (
    select coalesce(jsonb_agg(jsonb_build_object('source',coalesce(utm_source,source,'Direct'),'medium',coalesce(utm_medium,'(none)'),'campaign',coalesce(utm_campaign,'(not set)'),'users',users,'signupCompletions',signups) order by users desc),'[]'::jsonb)value
    from(select metadata->>'utm_source' utm_source,metadata->>'utm_medium' utm_medium,metadata->>'utm_campaign' utm_campaign,source,count(distinct coalesce(user_id::text,anonymous_id))::int users,count(*) filter(where event_name='signup_completed')::int signups from public.app_events,bounds b where occurred_at>=b.from_ts and occurred_at<b.to_ts group by metadata->>'utm_source',metadata->>'utm_medium',metadata->>'utm_campaign',source limit 100)x
  )
  select jsonb_build_object(
    'registration',to_jsonb(r),'active',to_jsonb(a),'registrationTrend',rt.value,'activeTrend',at.value,
    'featureAdoption',fa.value,'funnel',f.value,'recentRegistrations',re.value,'retention',ret.value,'firstPartyAttribution',fp.value,
    'historicalDataComplete',exists(select 1 from public.app_events where created_at<=p_from),'analyticsStartedAt',(select min(created_at) from public.app_events)
  ) into result from registration r,active a,registration_trend rt,active_trend at,feature_adoption fa,funnel f,recent re,retention ret,first_party fp;
  return result;
end $$;
revoke all on function public.admin_analytics_report(date,date) from public,anon,authenticated;
grant execute on function public.admin_analytics_report(date,date) to service_role;
