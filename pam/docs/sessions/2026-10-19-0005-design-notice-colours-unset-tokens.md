# 2026-10-19 — design notice colours (unset tokens)

**Branch:** `claude/pam-design-notice-colours` (off main `9aac8b6f`) · **Lane:** design system (Dot)

## What changed

`packages/ui/src/Notice.tsx`, the compact row only: its fill and stripe used custom properties the theme never defines (`--color-background-sunken`, `--color-text-error`, `--color-text-warning`), so each fell to its fallback: a stripe in the text's own colour and no fill. They now use ones the theme does define: `--color-text-red` (error), `--color-text-orange` (warning) and `--color-background-muted` (the fill). Info already used `--color-text-accent`.

The full `Notice` card has the same three unset names for its stripe. They are **left as they are** (Mira, 19 October: Will has seen the black stripe for a week, and a stripe colour across many screens is his to see first). Before/after pictures of the offline card are in `docs/design/review/2026-10-19-notice-card-offline-{before,after}-{light,dark}-320.png`; if he says yes, the card stripes follow as their own small change (the two lines in `styles.error` and `styles.warning`).

## Was it meant to look like that?

No. Nothing records it: D-509 and D-510 (the small alert) say nothing of fill or stripe colour, and the compact notice's own comment says it has "the same three tones as Notice". I wrote the unset names on 11 October (`1480edb5`) with fallbacks that hid that they did not resolve. It is a second missing surface, and a missing stripe colour.

## What changes on screen

The inline compact alert (sign-in's wrong code, the only inline use) and the bottom alert get a light fill and a red stripe. Colours only; no layout moves. Pictures: `docs/design/review/2026-10-19-notice-colours-after-compact-*`.

## Verified

New test in `e2e/signin-wrong-code.spec.ts` (stripe is not the text colour, the row has a fill) fails on main's real build and passes here on all three projects (21 passed). `@pam/ui` tests 130 passed.

## Left undone

The full card stripes, waiting on Will.
