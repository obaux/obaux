# 2026-10-13 — design role badge fit (b26)

**Branch:** `claude/pam-design-role-badge-fit` · **Lane:** Design systems

## What changed
`packages/ui/src/AppHeader.tsx`: the role chip keeps its words whole; the header row wraps so the corner takes its own row when it cannot fit. New `e2e/role-badge-fit.spec.ts` and a `Narrow rows` story in `AppHeader.stories.tsx`.

## What was wrong, and what missed it
`Badge` breaks anywhere (D-422), so the chip split at 320 with the bell. The test written for it then showed the real problem in Spanish: the header's right side was wider than the screen. `audit:fit` did not catch either (a word cut across lines is not one of its defect types, and the account button was clipped by the page, not a box).

## Decisions made
D-551.

## Verified
See the READY.

## Left undone
Nico's bell branch (hide the bell when there is none) is separate; with it, most members have no bell and the header is one row.

## Needs a human
Nothing.
