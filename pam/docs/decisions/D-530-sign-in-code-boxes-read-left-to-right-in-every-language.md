# D-530 — Sign-in code boxes read left to right in every language

**Date:** 2026-10-11 · **Branch:** `claude/pam-design-code-boxes-ltr`

## Decided

Iris (CP3, `docs/research/2026-10-11-help-site.md` Part 4), relayed by Mira: in Arabic the six code boxes (D-251) filled from the right, so typing 1234 showed "_ _ 4 3 2 1" while the texted code reads 1234.

The boxes and the hidden field behind them are now `dir="ltr"` in `CodeBoxes`, the way the phone number beside them is isolated. Digits fill left to right in every language. The label above and the alerts around the boxes keep the page's direction.

## Why

A code is a string of digits read in order, in Arabic as in English; it is not text that flows. Phone numbers and one-time codes are conventionally left to right in right-to-left layouts. Lena is asked to confirm that for Arabic readers; if she disagrees the change is one attribute.

## Test

`apps/web/e2e/signin-code-boxes-ltr.spec.ts` (Arabic): typed 1234 reads 1, 2, 3, 4 from the left, a pasted "Your code is 123456" reads 1 to 6 from the left, and the group is `ltr` inside an `rtl` page. It fails without the attribute.

## What a later session might reverse

Nothing expected. Any other code or number field added later should be isolated the same way.
