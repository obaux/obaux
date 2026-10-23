# 2026-10-18 — design BigButton plain name and the 48px language check

**Branch:** `claude/pam-design-bigbutton-plain` (off main `9aac8b6f`, b76) · **Lane:** design system (Dot)

## What changed

- `packages/ui/src/BigButton.tsx`: the button's accessible name (label, joiner, count) goes through `stripIsolates` from `@pam/config`, so a caller that built the label or the count with `t` still gives a screen reader plain words (D-435). What is drawn keeps them. Today's callers pass a count made of numbers only (a number is never isolated), so nothing changes on screen or in a name; this closes the door for a count or label that carries a text value.
- `packages/ui/test/big-button-name.test.tsx`: two tests; the first fails without the change.

## The 48px check

Lena's S1 cap on a list of languages is 9 rows of 48px (432px). Seven rows at 48px plus padding are 344px. Measured at 320px wide in all seven languages (the Sign up list): every row 48px, scrollHeight 344 = clientHeight 344, no scroll. `e2e/language-list-fits.spec.ts` (all three projects, 48 tests) passes on this branch's e2e build; it already pins this. Nothing to change.

## Verified

`@pam/ui` tests 132, `@pam/config` tests 1491, `tsc` clean, bundle budget 6.0 kB spare (594.0 of 600), language-list-fits 48 passed.

## Left undone

The Arabic synced-button words stand-in, waiting on Lena's translation of Sage's words.
