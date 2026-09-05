# Quick Entry

Quick Entry turns a short phrase into a reviewable finance draft. Parsing is deterministic and lives in `lib/quick-entry`, independently of React and Supabase, so later web or messaging adapters can call the same parser. Parser output is never treated as authorization and is never saved without explicit confirmation.

## Supported input

- Expenses: `biryani 500`, `fuel 1200`, `spent 500 on lunch`, `groceries 3200`, `uber 650`, `movie 900`
- Income: `salary 120000`, `received salary 120000`, `freelance 25000`, `bonus 30000`
- Debt payments: `paid 10000 credit card`, `credit card payment 8000`, `paid 5000 towards personal loan`
- Amounts: plain numbers, Indian comma separators, the rupee symbol, `k`, and `lakh`, including decimals
- Dates: `today` and `yesterday`; otherwise today is used

Expense and income classification rules are centralized in `lib/quick-entry/rules.ts`. Unknown expense or income descriptions can use `Other` after review. The initial currency is deliberately INR, consistent with the current product phase.

## Safety behavior

The parser only matches normalized full debt names from the authenticated user's loaded debt list. It does not guess among multiple matches. Missing type, amount, account, or debt keeps confirmation disabled and exposes editable controls. A default INR account is preselected only when explicitly marked as default; no arbitrary account is chosen.

Confirmed expense and income entries use the authenticated transaction API. That API validates shape, INR currency, account ownership, optional income ownership, and dates. Quick Entry sends an idempotency key, and the database enforces one transaction per user/key. Debt confirmation reuses the existing atomic, idempotent debt-payment operation and never edits a debt balance directly.

## Future channels

A future Telegram, WhatsApp, or receipt adapter should normalize its text into a plain string, obtain that authenticated user's debts and explicit default account, call `parseQuickEntry`, and present the returned draft for confirmation. Those adapters must use the same authenticated confirmation APIs and must not write parser output directly to the database.
