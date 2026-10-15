# 2026-10-14 — design sign-in spacing

**Branch:** `claude/pam-design-signin-spacing` (off `main` @ 36cd4651) · **Lane:** design system

## What changed

`PhoneSignInCard` and `SignInScreen`: the `default: null` on the stack's `rowGap`, the card's padding and the brand group's gap replaced by the spacing tokens they had. `OnboardingSlides`: a 641–720px-tall tier (46vh) so 375×667 still fits. New test in `signin-short.spec.ts`. D-572.

## What was wrong, and what missed it

My D-564 used `null` as a conditional style's default; in StyleX that unsets the component's own gap and padding on every screen. Every test I wrote measured the 320×568 fit, where tight is right; none looked at 390×844. It was live from b32. Will saw it in Ava's picture.

## Decisions made

D-572.

## Verified

Measured at 390×844: gaps 24 / 12 / 8 / 12 / 12 (was 4 / 0 / 8 / 0 / 0). 375×667 ends at 659 of 667. 42 fit cases: 0 not fitting. signin-short, consent, signin-next, signin-wrong-code, join at narrow-320 pass.

## Left undone

Nothing. 360×640 and 320×568 are unchanged (under the 640px rule).

## Needs a human

Will: look at the after pictures.
