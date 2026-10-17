# 2026-10-17 — design visit widget a91 part 3

**Branch:** `claude/pam-design-visit-widget` · **Lane:** design system (Dot)

## What changed

Built the visit widget in `packages/ui/src/VisitCard.tsx` (old `VisitCard` kept for the booked screen). Views, eye-button Popover, `hasLead`, `showsCheckIn`, callbacks, check-in result slot, Escape to go back, focus moved into each view. Removed `VisitWidget.tsx` and its export. Stories rewritten: every view, six other languages, 320. Vitest added.

## What was wrong, and what missed it

## Decisions made

None new: Mira's brief and Will's a91 words decided it. Marked is a one-time state, so its banner makes the card ~18px taller than the rest view; the three views themselves never change height.

## Verified

`pnpm --filter @pam/ui test` (132 pass), tsc in ui and web, `build-storybook` with its guard; every story shot at 390 and 320, in es, zh-CN, ru and ar.

## Left undone

Piper wires the page. New words (eye note label, Close, Back, Change date and time, Cancel visit, "I made it") go through Sage and Lena. Will's footer word (A or B).

## Needs a human
