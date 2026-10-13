# 2026-10-13 — design sign-in polish b32

**Branch:** `claude/pam-design-signin-polish` (from `mira/batch-b32` @ 72562dba) · **Lane:** design system

## What changed

- `SignInScreen`: the compact bar shows when less than half the hero mark is in view (threshold 0.5), not when it is gone (P1).
- `@pam/config` `nameJoinerOf(locale)`; `BigButton` `nameJoiner`; Join and the program wizard pass it (P5). A unit test covers it.
- Before/after pictures of the hand-over, en and ar, 320×568.

## What was wrong, and what missed it

At threshold 0 the hero mark left a 4–8px sliver for about 8px of scroll before the bar came in. My fit tests measured the end of the scroll, not the hand-over. The comma was a literal in `BigButton`.

## Decisions made

D-566.

## Verified

`signin-short`, `join`, `consent`, `signin-next` at narrow-320: 68 passed. `i18n.test.ts`: 32 passed. `tsc` clean. Hand-over measured at y = 0–96 for en and ar before and after.

## Left undone

The count in the button's name still goes through `t` (bidi isolates in Arabic; D-435 wants `tPlain`). The Arabic and Chinese names were not read by a screen reader, only built from the table.

## Needs a human

Nothing.
