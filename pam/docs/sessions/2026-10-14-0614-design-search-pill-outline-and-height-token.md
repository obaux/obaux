# 2026-10-14 — design search pill outline and height token

**Branch:** `claude/pam-design-search-pill` (off `main`) · **Lane:** design system

## What changed

`globals.css`: one rule gives the active search pill its 3px outline back. `tokens.stylex.ts` / `tokens.css`: `--pam-search-height` (60px), read by the launcher and the search group in `SearchPill.tsx`. `focus-text-boxes.spec.ts` asserts the pill and the 60px heights. D-574; a line added to D-569. Pictures before and after at 390.

## What was wrong, and what missed it

D-569 took the pill with the text boxes: I treated "undo the rules about text boxes" as including search bars. Will meant not search.

## Decisions made

D-574.

## Verified

focus-text-boxes, theme, consent, area-picker, street-search, places, messages e2e at narrow-320: 144 passed; tsc clean. Measured 60/60/60 (resting, open, sheet).

## Left undone

Width and alignment of the resting bar versus the active one (Will's "feel as one") is a choice, said in D-574.

## Needs a human

Will: whether he wants the active bar's words centred, or the resting bar's at the left.
