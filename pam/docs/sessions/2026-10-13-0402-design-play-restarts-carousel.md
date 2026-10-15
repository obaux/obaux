# 2026-10-13 — design play restarts carousel

**Branch:** `claude/pam-design-play-restarts` · **Lane:** Design systems

## What changed
`packages/ui/src/OnboardingSlides.tsx` and `apps/site/src/components/FlipCarousel.tsx`: only keyboard focus holds the carousel; an explicit Play lets go. New `e2e/onboarding-play-restarts.spec.ts`.

## What was wrong, and what missed it
D-501's "hold while focus is inside" counted the focus a tap leaves on a button. Desktop clicks and the tests never noticed because no test paused and played without leaving the button, and the suite runs with reduced motion, which hides the Pause control (the new test turns motion on).

## Decisions made
D-554.

## Verified
See the READY. The click test fails without the fix.

## Left undone
`BandViews` (Wren) has the same hold on `inside`.

## Needs a human
Nothing.
