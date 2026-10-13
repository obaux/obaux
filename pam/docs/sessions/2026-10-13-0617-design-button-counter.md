# 2026-10-13 — design button counter

**Branch:** `claude/pam-design-button-counter` · **Lane:** Design systems

## What changed
`packages/ui/src/BigButton.tsx`: the step count is plain 12px text (75% of the button's text colour), level with the label, label centred by an equal invisible copy at the other end. Story `WithLongStepBadge`; `e2e/join.spec.ts` gained a seven-language check. Before and after pictures in `docs/design/review/2026-10-13-button-counter/`.

## What was wrong, and what missed it
The pill sat 4px below the label (the button is 48px, the pill was placed for 56) and a wide Chinese count overlapped the label at 320. Nothing measured it.

## Decisions made
D-560.

## Verified
tsc; join.spec 19/19 at 320 (incl. axe); Storybook looked at in light, dark, English, Arabic, Chinese.

## Left undone
The language dropdown for Join (Ava builds it; the control spec is sent).

## Needs a human
Nothing.
