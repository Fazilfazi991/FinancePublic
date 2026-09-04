This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
# Finance — secure multi-user setup

This Next.js application uses Supabase Auth, Postgres, and Row Level Security. Every finance row is owned by the authenticated user. INR (`en-IN`) remains the default currency.

## Local setup

1. Copy `.env.example` to `.env.local` and add the project URL and browser-safe publishable key. Never add a secret/service-role key.
2. Apply SQL files from `supabase/migrations` in filename order (Supabase CLI or Dashboard SQL Editor).
3. In Supabase Auth URL Configuration, set the production Site URL and allow `http://localhost:3000/auth/callback` for development.
4. Email OTP works through Supabase email auth. Google requires a Google OAuth web client and the callback shown on Supabase’s Google provider page.
5. Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, then `pnpm build`.

## Security model

RLS is enabled on all user-owned tables. Policies use `auth.uid()` for select, insert, update, and delete. API handlers independently resolve the authenticated user and never accept `user_id` from request bodies. Debt payment is one PostgreSQL RPC transaction: ownership validation, transaction creation, balance update, and payment-history insertion either all commit or all roll back.

## Payoff engine assumptions

Freedom Number is the sum of active debt balances. Monthly Payoff Power is monthly income minus essential non-debt living expenses; debt payments must not be counted again as living expenses. Avalanche prioritizes known highest APR (unknown APR follows known APR); Snowball prioritizes lowest balance. Interest compounds monthly, required minimums are paid first, and cleared-debt capacity rolls forward. Ties resolve deterministically by balance/APR then ID.

Payoff dates are estimates. Missing APR lowers estimate quality, and a budget below required minimums produces a shortfall state instead of a misleading date. This is planning software, not guaranteed financial advice.
