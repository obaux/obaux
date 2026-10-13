# 2026-10-13 — design sign in fit

**Branch:** `claude/pam-design-signin-fit` · **Lane:** Design systems

## What changed
Below 640px tall: the hero slide is shorter (42.5vh, floor 224), the invite bar, the card's spacing and the logo-to-chip gap are tighter, so Sign in fits with Ava's and Lena's words. `TextLink` gained `isUnderlined`, with a story.

## What was wrong, and what missed it
The 280px floor on the hero slide stopped it shrinking on a 568px screen; with Will's longer invite line the button fell 12px off. Only English did, so the existing test caught it once Ava's words were in.

## Decisions made
D-564.

## Verified
42 cases (7 languages × 3 phone sizes × invited or not) with Ava's words and Lena's translations, on a throwaway merge: all fit, the hero's words clear the chip and the dots. signin-short, consent, signin-next, signin-wrong-code 50/50. tsc.

## Left undone
Ava swaps in `isUnderlined` on her reveal link.

## Needs a human
Nothing.
