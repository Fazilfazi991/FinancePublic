# Owner admin and analytics

## Setup

1. Apply `supabase/migrations/20260907000100_owner_admin_analytics.sql`.
2. Promote the first verified owner out of band in the Supabase SQL editor: `update public.profiles set role = 'super_admin' where id = '<auth user uuid>';`. Never expose this as a registration or profile field.
3. Set the variables documented in `.env.example`. Use a Google service account with read-only access. Preserve private-key newlines as escaped `\n` characters.
4. In GA4, grant the service-account email the Viewer role on `GA4_PROPERTY_ID`. `NEXT_PUBLIC_GA_MEASUREMENT_ID` is the public web measurement identifier; it is not a credential.
5. In Search Console, add the service-account email as a Restricted user on the exact `GSC_SITE_URL` property. Domain properties use `sc-domain:example.com`; URL-prefix properties use their full URL.
6. Schedule `POST /api/admin/cron/analytics` with `Authorization: Bearer $ANALYTICS_SYNC_SECRET`. The endpoint uses hourly idempotency keys, caches 90 days of daily summaries, and succeeds partially if one provider is disconnected.

Never place Google refresh tokens, private keys, Supabase secret keys, names, emails, phone numbers, or financial values in browser analytics payloads.

## Metric definitions

- **Total registrations:** non-deleted rows in `profiles`; the database is authoritative.
- **Verified users:** profiles with `email_verified_at`.
- **DAU / WAU / MAU:** authenticated users producing at least one allowlisted, meaningful first-party application event in the trailing 1 / 7 / 30 days. These currently count event records in the overview implementation; use daily unique-user rollups for large scale.
- **Website CTA clicks:** allowlisted `cta_clicked` first-party events only.
- **Search Console clicks:** Google Organic Search clicks imported from Search Console; never merged with CTA clicks.
- **Signup completion rate:** `signup_completed / signup_started` for the selected period.
- **Onboarding completion rate:** profiles completing onboarding divided by profiles registered in the selected period.
- **Application feature actions:** creation, contribution, payment, and AI-message events; excludes page views and acquisition clicks.

## Privacy and retention

The event endpoint accepts only known names and scalar, per-event metadata keys. It rejects common PII keys and email/phone-shaped values, caps metadata in both validation and PostgreSQL, derives authenticated ownership from Supabase Auth, rate-limits by server-side history, and supports idempotency keys. Account deletion can null the event user reference while retaining approved aggregate events; configure a retention job appropriate to your jurisdiction.
