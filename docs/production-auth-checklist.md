# Production authentication checklist

- Set Authentication → URL Configuration → **Site URL** to the canonical HTTPS production origin.
- Add exact redirect URLs for `https://YOUR_DOMAIN/auth/callback` and `http://localhost:3000/auth/callback`; remove obsolete preview origins.
- In Authentication → Providers → Google, enable Google only after entering the OAuth web Client ID and Client Secret. Never commit the secret.
- In Google Cloud, configure the Supabase callback displayed on the provider page and restrict JavaScript origins to approved origins.
- Review the Email OTP/magic-link template, sender name, expiry, and redirect behavior. Do not put an OTP or token in logs.
- Configure a dedicated SMTP provider before production. Supabase’s default sender is restricted and intended for development/testing.
- Review Supabase Auth rate limits and CAPTCHA options before public launch; keep responses generic to limit account enumeration.
- Verify expired/invalid links return to `/auth?error=callback`, successful links create a cookie session, and logout returns to `/auth`.
- Test both production and localhost redirects after every domain change.
