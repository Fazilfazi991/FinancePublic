# ZeroDebt Design System

The authenticated product retains its existing operating UI. The public landing page uses the Stitch-derived **Serene Zero / Playful Editorial** system documented here.

## Character

Calm financial confidence with an editorial edge: warm paper, botanical color, expressive scale, honest numbers, generous pauses, and a small amount of playful asymmetry. It should feel hopeful and premium without becoming corporate fintech, crypto, or wellness pastiche.

## Color

- Paper: `#FBFBF7`
- Sage surface: `#F2F6F2`
- Refined line: `#DFE8E1`
- Deep forest: `#0D3B2E`
- Ink: `#082F24`
- Progress mint: `#34D399`
- Mint wash: `#E6F8F3`
- Muted graphite: `#536059`

Mint communicates movement and successful progress. Existing debt remains graphite or forest, never punitive red. Large fields may span the viewport while content stays capped at 1200px.

## Typography

Use the product sans for clear headings, copy, and controls with tight editorial tracking on large display text. Financial values use tabular numerals. A restrained serif italic may emphasize the word “zero” in the public hero; it is a signature contrast, not a general heading style.

## Shape and Depth

Structural cards use 12–16px radii; the primary product canvas may reach 28px. Pills are reserved for brief statuses and compact actions. Prefer tonal separation and soft botanical shadows with a visible vertical offset. Avoid glass stacks, hard offset shadows, and decorative gradients.

## Landing Composition

The first viewport pairs the brand promise with an asymmetric, lightly tilted payoff canvas showing the Freedom Number, progress, next debt, and payoff power. Mobile flattens the tilt and becomes a deliberate single-column story:

1. Understand the total.
2. Know what to pay next.
3. See progress through the Freedom Number.
4. Choose Avalanche or Snowball.
5. Log quickly through Telegram.
6. Ask account-aware questions.
7. Start on the free plan.

Section pacing alternates quiet paper, sage, mint, and forest surfaces. Avoid generic equal-card feature grids.

## Motion

Use one calm motion language: a slow floating payoff canvas, a progress line drawing from the left, and a short stagger for conversational prompt chips. Motion never carries essential meaning. Under `prefers-reduced-motion`, remove floating and collapse animation durations.

## Accessibility and Content

Keep focus rings visible, CTA targets near 44–48px, headings semantic, and contrast WCAG-friendly. Public financial values are clearly illustrative and the landing page never requests protected account data. Primary CTAs route to `/auth`; authenticated routing is handled by the existing auth middleware.
