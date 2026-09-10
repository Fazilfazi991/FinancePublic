# ZeroDebt: Money to Receive UI

## Overview

This extension preserves the established authenticated, mobile-first ZeroDebt interface. Money to Receive adds lending and repayment tracking; Support ZeroDebt remains a quiet, optional destination. Existing tokens, cards, buttons, and Radix dialogs remain the visual source of truth. This document supplements the design system without redefining its identity.

## Colors

Use the existing `background`, `card`, `border`, `primary`, `secondary`, and muted text tokens in both themes. Settled badges use primary text over `primary/10`; Active and Partially Paid badges use secondary surfaces. Overdue badges use `destructive/10` with `hsl(var(--destructive-text))`.

The semantic `--destructive-text` token is `0 72% 42%` in light mode and `0 85% 72%` in dark mode. Use it for receivable errors and text-only delete actions; destructive confirmation buttons retain the existing destructive button variant. Native select and date controls explicitly use `color-scheme: light` and `dark:color-scheme: dark`, including the browser's calendar icon.

## Typography

Page titles retain `text-3xl`, bold weight, and tight tracking. Person names use semibold `text-xl`; explanatory text uses muted foreground. Monetary values use tabular numerals and wrapping where needed. Form controls use 16px text on mobile; labels remain visible above controls.

## Layout

`mobile-page` preserves vertical spacing and bottom navigation clearance. `mobile-card` provides rounded-2xl corners, a border, card background, and a small shadow. Summary cards use two columns, expanding to four at `sm`; receivable cards become two columns at `md`. Card actions wrap, while names and amounts can break within `min-w-0` containers.

Detail and editor dialogs reuse `finance-sheet`: scrollable, viewport-bounded bottom sheets below 640px, with safe-area padding and a sticky header. Larger screens retain the shared centered `max-w-lg` dialog. Keep the detail Record Payment button unconstrained by inline width overrides so its complete label remains visible. Page and support primary actions are full width on small screens and intrinsic width from `sm`. The support card is limited to `max-w-xl`.

New buttons and controls have a minimum 44px height; dialog back/close targets are explicitly 44px square. More navigation rows retain their 72px minimum height.

## Components

- **Navigation:** Money to Receive appears after Debts in the desktop sidebar and first under Finances in More. The mobile tab structure stays Home, Activity, add action, Plan, More. Support sits near the sidebar footer and under Account & app in More. The overview summary links to `/receivables` through See details.
- **Summaries:** Each currency has its own Outstanding, Received Back, Overdue, and People values. Received Back is original minus outstanding. People currently counts active receivable records, not deduplicated borrowers. The overview shows outstanding totals per currency and an active-record count; currencies represented only by settled records still display zero. Never combine currencies into one total. Amount sorting compares displayed numeric values across currencies, with an explanatory note when multiple currencies exist.
- **Status and discovery:** Zero outstanding is Settled; a due date before today with a remaining balance is Overdue; otherwise a reduced balance is Partially Paid, then Active. Active filtering includes every positive balance. Search matches person names; filters offer All, Active, Overdue, Settled. Sorting supports age, outstanding amount, due date, and overdue priority. Cards expose received/remaining values and a labeled repayment progress bar.
- **Editor:** Add/edit lending collects borrower, amount, account, date lent, optional due date, and notes. Payment editing collects amount, destination account, date, and notes; new payments offer Full remaining amount. Existing receivables restrict accounts to their currency. Demo and receivable accounts are excluded, and an empty eligible-account list explains the requirement and disables Save. Copy clarifies that lending is not an expense and repayment is not income. Pending saves disable Save/Cancel; errors stay in the dialog.
- **Detail and deletion:** Details show dates, source account, notes, balances, and payment history sorted by payment date descending. Remaining balances expose Record Payment. Each payment offers Edit payment and Delete payment. Delete confirmations explicitly describe balance reversal: removing a receivable reverses the original debit and all repayment credits; removing a payment reverses its credit and restores outstanding. The confirmation uses Delete and reverse balances plus Cancel. Success refreshes receivables and workspace balances, with a refresh notice if workspace loading fails.
- **Support:** One card explains that ZeroDebt remains free and offers Buy Me a Coffee. The external link opens a new tab with an accessible announcement and `noopener noreferrer`; decorative icons are hidden from assistive technology.
- **Accessible states:** Inputs/selects have wrapping labels; dialogs have titles and descriptions; close/back controls have accessible names. Progress exposes the percentage repaid. Loading and success use status messages; failures use alerts. Empty, no-match, unavailable-summary, and retry states have explicit copy.

## Do's and Don'ts

- Do extend the existing authenticated shell, semantic tokens, and shared dialog behavior.
- Do preserve readable wrapping, currency separation, visible labels, and 44px action targets.
- Don't introduce a separate visual theme or promotional interruption for support.
- Don't substitute the destructive fill token for readable danger text.

Verification recorded for this extension: 32 fixture checks passed at 360, 390, 430, and 1280px across light/dark themes using a mock API. The finish review marked clipped detail action, danger contrast, and dark date icons resolved. This evidence covers fixture UI behavior, not real authentication or physical-device testing.
