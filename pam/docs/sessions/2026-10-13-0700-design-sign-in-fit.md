# 2026-10-13 — design sign in fit

**Branch:** `claude/pam-design-signin-fit` · **Lane:** Design systems

## What changed
`OnboardingSlides`: below 640px tall the hero slide is shorter (44vh, floor 224) so Sign in fits. `TextLink` gained `isUnderlined`, with a story.

## What was wrong, and what missed it
The 280px floor on the hero slide stopped it shrinking on a 568px screen; with Will's longer invite line the button fell 12px off. Only English did, so the existing test caught it once Ava's words were in.

## Decisions made
D-564.

## Verified
42 cases (7 languages × 3 phone sizes × invited or not) with Ava's words, on a throwaway merge of her branch: all fit. signin-short and consent specs 41/41. tsc.

## Left undone
Ava swaps in `isUnderlined` on her reveal link.

## Needs a human
Nothing.
