# Money to Receive: implementation and verification

## Database and deployment order

Migration: `supabase/migrations/20260910043425_receivables.sql`.

Both this migration and `20260910061937_restore_ai_checks_and_harden_grants.sql` are already applied and verified in production. Application deployment must not replay database migrations. The local migration history matches all 14 production versions.

New tables are `receivables` and `receivable_payments`. Every row has an authenticated owner. Composite foreign keys enforce ownership of source/destination accounts, transactions, and parent receivables. Account deletion remains restricted while referenced. Changes of account currency are blocked while these records reference it.

Both tables have RLS and authenticated SELECT-only grants. All six operations go through `mutate_owned_receivable`: `create`, `update`, `delete`, `payment_create`, `payment_update`, `payment_delete`. This SECURITY DEFINER function has an empty search path, requires `auth.uid()`, checks ownership explicitly, and is executable only by authenticated users. PUBLIC and anon execution is revoked. It locks the user's mutation stream and the parent row in the same transaction. UUIDs supplied for creates provide retry idempotency. Financial validations and writes happen in PostgreSQL numeric arithmetic.

A trigger blocks direct Data API writes and the existing generic transaction RPCs from modifying managed ledger types. Existing transaction update/delete RPC definitions remain unchanged. Indexes cover owner/creation date, active due dates, owner/parent/payment date, source accounts, and destination accounts.

## Accounting

- Lending inserts `receivable_out`: source account decreases; outstanding increases.
- Repayment inserts `receivable_repayment`: destination account increases; outstanding decreases.
- Editing changes the existing linked ledger entry atomically. Because account balances derive from opening balances plus the ledger, moving an entry reverses the old account's effect and applies the new account's effect without an extra stored balance.
- Deleting a repayment removes its credit and restores outstanding. Deleting the parent removes the debit, all repayment credits, and the corresponding records together.
- Income and expense classifications remain unchanged. Savings, spending, cashflow, debt totals, and income/expense reports retain their existing filters.
- Net Worth includes outstanding receivable assets in addition to account balances, using its existing conversion rules. Lending and repayment therefore exchange asset forms without creating a loss or gain.
- The new overview and page summaries show currencies separately. Repayments and source account changes require the original currency. Sample accounts and legacy `receivable` account types are not eligible.
- Status is derived from remaining/original amount and the current local date; overdue is never persisted as a stale status.

## API and types

`GET /api/receivables` returns owned receivables with nested payment histories in one PostgREST query. `POST /api/receivables` authenticates, validates with Zod, and invokes the atomic RPC. TypeScript record and mutation types live in `lib/receivables.ts`; the shared transaction union includes the two managed types. Financial payloads are not sent to analytics; the seven added event names accept no metadata.

## Repeatable checks

Use the existing pnpm dependency setup (`pnpm install --frozen-lockfile`). The repository's pre-existing npm lockfile differs from its current pnpm dependency graph; npm dependency installation encountered a resolution conflict. The new test-only PGlite dependency is pinned in package.json and pnpm-lock.yaml.

- `npm run typecheck`
- `npm run lint`
- `npm test` (HTTP tests skip unless `TEST_BASE_URL` points to a local running app)
- `npm run build`
- Start the built app with `npm run start -- --port 3017`, then set `TEST_BASE_URL=http://localhost:3017` and run `npm test` to include unauthenticated HTTP tests.

`tests/receivables-database.test.ts` executes the actual finance schema, hardening, quick-entry metadata, existing transaction RPC, and receivable migrations in PGlite. It tests creation, partial/full repayment, overpayment rollback, amount/account edits, deletion reversal, exact numeric cents, repeated submissions, RLS, ownership, anonymous denial, managed-ledger guards, currency restrictions, and existing income/expense/transfer/debt-payment behavior.

For browser verification, run `node scripts/serve-receivables-ui.mjs`, then `node scripts/verify-receivables-ui.mjs`. The latter requires Playwright available through normal module resolution or `PLAYWRIGHT_PACKAGE_PATH`; optionally set `CHROMIUM_EXECUTABLE` to a compatible installed Chromium binary. `UI_ARTIFACT_DIR` controls screenshots. The fixture imports the actual components and styles while intercepting all API traffic with disposable test data. It runs 32 layout/interaction checks across 360, 390, 430, and 1280px in light/dark mode, including touch sizes, mobile input fonts, search, history, edit form, full repayment, settled filter, empty/error/retry states, and support-link attributes.

## Verification state

Authenticated production verification passed using two authorized disposable identities and actual Supabase password sessions. All lifecycle operations, exact balance reversal, cross-user isolation, managed-ledger guards, idempotency, and concurrent repayments from independent authenticated sessions passed. All temporary financial rows, identities, and credentials were removed. Net Worth remained AED25,000 throughout the lifecycle; initial and final account balances were AED20,000 and AED5,000.

The full local regression passed 238 tests with zero failures or skips, including localhost HTTP checks. Typecheck, lint, and production build passed. Real authenticated UI checks passed against the local production build and production Supabase. Operational receipts are retained locally, outside the release commit.

The reusable browser fixtures cover 360,390,430 and1280px in light/dark themes with mocked data. Emulated viewports do not replace Safari/iOS/Android hardware keyboard, date picker, screen-reader, and touch testing. Hosted production smoke verification follows the application deployment.
