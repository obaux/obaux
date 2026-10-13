# D-564 — Sign in fits a short screen; running-text links are underlined

**Date:** 2026-10-13 · **Branch:** `claude/pam-design-signin-fit` (off main), for Ava's W6 (D-563)

Two calls from Mira, from Ava's W6 (`claude/pam-join-first-time-wording`).

## 1. Sign in on a short screen

Will's longer member line ("You were invited to join Pam. Start with your phone number. We'll text you a code. There's no account to make first.") wraps to three lines at 320 and pushed "Send me a code" 12px below a 320×568 screen (English only; the other six languages had 9 to 78px to spare). The words are Will's, so the fix is layout, by height:

- **`OnboardingSlides` hero slide**, below **640px tall**: the slide is `clamp(224px, 44vh, 520px)` (it was `clamp(280px, 50vh, 520px)`, whose 280px floor held at 568) and the room under the words is 32px (was 40). At 320×568: 250px instead of 284; the button's foot moves from 580 to 546, 22px to spare. Taller screens are unchanged.
- Measured with Ava's words, in all seven languages × 320×568, 360×640 and 390×844 × invited and not (42 cases): every "Send me a code" is whole on the screen. `signin-short.spec` and `consent.spec` pass (41/41).
- The pictures lose about 34px of height on a short phone and keep their words; the slide's text still sits clear of the brand chip.

## 2. The reveal link ("If yes, click here to enter code.")

**An underlined `TextLink`**, not a quiet button. It sits among words, so colour alone does not tell it (D-562's rule, for the app too); and it is a text link that reveals a field, which is what `TextLink` is for. New prop **`isUnderlined`** on `TextLink` (`@pam/ui`): the line all the time; the look otherwise as D-271 (no pill; the accent colour on hover). Ava: `<TextLink label={t('join.code.reveal')} onClick={revealCode} isUnderlined />`. A link standing alone in a row (Back, Sign out, Skip) needs no line and keeps D-271.
