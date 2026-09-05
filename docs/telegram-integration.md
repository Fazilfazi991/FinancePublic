# Telegram integration

## Architecture

Telegram sends text and callback updates to `POST /api/telegram/webhook`. The route verifies Telegram's secret header, rejects duplicate update IDs, applies a per-user rate limit, and delegates to the server-only bot module. The bot loads the linked user's default account and debt names, then calls the same deterministic `parseQuickEntry` function used by the web application. Nothing is saved before an inline Confirm action.

The integration uses direct Telegram Bot API HTTPS calls to avoid a large bot framework. Database access from the public webhook uses `SUPABASE_SECRET_KEY`, which must only exist in Vercel's server environment. RLS continues to protect browser access; bot code always includes and revalidates the linked Finance user ID. Debt payments call the existing `record_debt_payment` operation through a service-role-only adapter function.

## Configuration

Required Vercel variables:

- `SUPABASE_SECRET_KEY` — server-only Supabase secret key
- `TELEGRAM_BOT_TOKEN` — BotFather token
- `TELEGRAM_WEBHOOK_SECRET` — random secret accepted by Telegram's `secret_token` field
- `TELEGRAM_BOT_USERNAME` — username without `@`

Never prefix these with `NEXT_PUBLIC_` or commit their values. After adding them, redeploy and run `node scripts/configure-telegram-webhook.mjs` in an environment where the two Telegram secrets are present. It configures `https://finance-public-sigma.vercel.app/api/telegram/webhook` without printing either secret. There is deliberately no public webhook-administration endpoint.

## BotFather setup

1. Open `@BotFather` in Telegram.
2. Send `/newbot`.
3. Choose a temporary display name.
4. Choose the final unique bot username.
5. Receive the bot token.
6. Store it as `TELEGRAM_BOT_TOKEN` in Vercel Production; never commit it.
7. Add the bot username and a newly generated webhook secret to Vercel.
8. Redeploy, then configure the webhook with the documented script.

## Linking and security

An authenticated user opens More → Telegram and requests a connection link. Finance stores only a SHA-256 hash of a random 192-bit token. The raw token appears only in the ten-minute Telegram deep link. `/start <token>` consumes it once and creates one active connection per Finance user and Telegram user. Disconnecting sets `revoked_at` immediately, preserves past transactions, and makes future bot updates unlinked.

Telegram callback data contains only an action and opaque UUID. Drafts expire after 20 minutes. Confirm atomically claims a pending draft, rechecks the connection and account ownership, and uses the draft UUID as the financial idempotency key. Duplicate Telegram update IDs, repeated message deliveries, and double confirmation therefore cannot create duplicate transactions. The limit is 20 updates per Telegram user per minute.

## Messages and retention

Supported text is the same as web Quick Entry, including `biryani 500`, `salary 120000`, and `paid 10000 credit card`. `/start`, `/help`, `/status`, and `/cancel` are supported. Ambiguous input is not confirmable. A missing default INR account returns an Open Finance button. Debt names must match deterministically; the bot never guesses among matches.

Raw message text is retained only while a draft is pending or processing. It is cleared on confirmation, cancellation, or `/cancel`; expired records should be periodically deleted or anonymized by a future scheduled cleanup. Bot code does not log message text, account names, balances, tokens, or callback payloads. Telegram API delivery failure does not roll back a financial transaction that was already committed.

## Troubleshooting

- `401` from the webhook: Telegram webhook secret does not match Vercel.
- “Telegram bot is not configured”: bot username is absent or invalid.
- Connection link rejected: token expired, was already used, or one side is already linked.
- Missing-account response: mark one INR account as default in Finance.
- Bot does not reply: verify Vercel variables, redeploy, rerun the webhook script, and inspect sanitized runtime status codes.

Future WhatsApp and receipt adapters should reuse `parseQuickEntry` and the secure confirmation services. Image parsing, WhatsApp, AI fallback, and receipt OCR are intentionally outside this phase.
