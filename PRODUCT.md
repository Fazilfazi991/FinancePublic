# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who want to understand and steadily pay down personal debt, especially on mobile, without connecting a bank account before they are ready.

## Product Purpose

ZeroDebt helps people track debt, decide what to pay next, understand their monthly payoff power, and make visible progress toward financial freedom.

## Positioning

ZeroDebt combines a focused debt-payoff plan and Freedom Number with lightweight Telegram entry and an account-aware financial copilot.

## Operating Context

Visitors evaluate ZeroDebt on the public landing page, then start through `/auth`. Authenticated customers use a separate finance dashboard and onboarding flow that are outside the landing-page visual system.

## Capabilities and Constraints

- Debt tracking, payoff planning, monthly payoff power, and progress tracking.
- Avalanche and Snowball payoff strategies.
- Telegram Quick Entry for recording spending without opening ZeroDebt.
- Ask ZeroDebt for account-aware guidance.
- The public page uses static illustrative values and never fetches protected financial data.
- The primary public CTA is `Start for Free` and leads to `/auth`; authenticated routing continues through the existing product flow.
- The landing page is mobile-first and must remain fast, maintainable, and usable with reduced motion.

## Brand Commitments

- Product name: ZeroDebt.
- Domain: zerodebt.life.
- Primary tagline: “A brighter tomorrow starts at zero.”
- Secondary line: “Less debt. A brighter you.”
- Preserve the approved logo assets in `public/brand`; do not redraw or replace the logo.
- Voice is hopeful, clear, grounded, slightly playful, and never corporate-fintech or crypto-like.

## Evidence on Hand

- Approved Stitch landing-page concepts in `stitch_zerodebt_landing_page_concepts.zip` at the workspace root.
- Approved ZeroDebt logo assets in `public/brand`.
- Existing product routes and UI demonstrate the debt, Telegram, and Ask ZeroDebt concepts.
- No approved testimonials, live user counts, or customer proof are available; future work must not fabricate them.

## Product Principles

- Make debt feel understandable and progress feel attainable.
- Show the product mechanism with honest illustrative data instead of generic promises.
- Keep the path from first visit to starting free obvious.
- Design intentionally for mobile rather than shrinking desktop.
- Keep financial information private and avoid fetching protected data on public surfaces.

## Accessibility & Inclusion

The public experience requires semantic structure, sufficient contrast, visible keyboard focus, descriptive labels and alt text, touch-friendly controls, and a meaningful reduced-motion experience.
