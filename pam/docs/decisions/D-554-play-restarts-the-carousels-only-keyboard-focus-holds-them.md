# D-554 — Play restarts the carousels; only keyboard focus holds them

**Date:** 2026-10-13 · **Branch:** `claude/pam-design-play-restarts`

Iris, re-testing b25 (W1): on Android Chrome, Pause then Play does not restart the carousel. Mira asked for the fix.

**Cause.** `OnboardingSlides` holds while focus is inside it (D-501), so a keyboard user arriving at a button is not carried to another picture mid-reach. A tap leaves focus on the button it touched, so after Pause → Play the carousel was still "focused" and stood still until the person tapped somewhere else (she waited 15s). On About Pam and Sign in, since 11 October. The website hero (`FlipCarousel`) had the same pattern.

**Decision.**
- Only focus a keyboard put there holds the pictures (`:focus-visible`); the focus a tap or click leaves does not. Browsers without `:focus-visible` hold as before.
- An explicit Play lets go of the hold, even for a keyboard user pressing Enter on it; moving focus to another control inside brings the hold back.
- `FlipCarousel`: the same, and Play also lets go of a pointer that is over it. A mouse resting over the carousel still holds it on its own (that was not changed).
- Keyboard behaviour is kept (WCAG 2.2.2): the Pause control stays; keyboard focus on the controls holds the pictures.

**Test.** `e2e/onboarding-play-restarts.spec.ts` on the sign-in screen (Pause, wait, it did not move; click Play without blurring, wait, it moved; Play with Enter; keyboard focus still holds). The click test fails on `main` and passes with the fix.

**Not done.** The Home green card's cycle (`BandViews`, Wren's branch) holds on `inside` too; Wren is told to apply the same rule.
