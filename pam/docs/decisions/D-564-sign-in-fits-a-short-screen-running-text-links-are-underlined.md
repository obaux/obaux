# D-564 — Sign in fits a short screen; running-text links are underlined

**Date:** 2026-10-13 · **Branch:** `claude/pam-design-signin-fit` (off main), for Ava's W6 (D-563)

Two calls from Mira, from Ava's W6 (`claude/pam-join-first-time-wording`).

## 1. Sign in on a short screen

Will's longer member line ("You were invited to join Pam. Start with your phone number. We'll text you a code. There's no account to make first.") wraps to three lines at 320 and pushed "Send me a code" 12px below a 320×568 screen in English. First check (Ava's words only, d83b5178): English only. Second check, with Lena's translations (`claude/lena-w6-invited-words` @ 92943790): the member line is four lines in pt-BR and ru, and the ru title wraps to two, so pt-BR ended 20px and ru 32px below the foot. The words are Will's, so the fix is layout, by height, all below **640px tall**:

- **Hero slide** (`OnboardingSlides`): `clamp(224px, 42.5vh, 520px)` (was `clamp(280px, 50vh, 520px)`) and 32px under the words (was 40). It cannot shrink further: the logo, the city chip, three lines of words and the dots all need their room (a smaller slide put the dots over the words and the words over the chip; the check below catches both).
- **Logo and chip** in the hero: 8px apart (was 16).
- **Invite bar**: 6px above and below its words (was 10), line spacing 1.3 (was 1.4).
- **The card** under the pictures: 8px above its title (was 20), 12px below it (was 20), 8px between the title, the field and the button (was 12), the title's line spacing 1.1 (was 1.2; the size stays 28, A27).
- Measured on a throwaway merge of Lena's branch with these changes: 7 languages × 320×568, 360×640, 390×844 × invited or not (42 cases): "Send me a code" is whole in every one (Russian, the tallest, ends at 553 of 568; Portuguese 542; English 503), the hero's words clear the city chip and the dots in every one. `signin-short`, `consent`, `signin-next` and `signin-wrong-code` specs pass (50/50).
- Taller screens are unchanged. One test needed a changed precondition: the "header stays on top as the page scrolls" test assumed a page 300px taller than the screen; on a short phone the page is now only 70 to 200px taller, so the hero may not scroll away and the compact bar has nothing to do. It now checks the bar where the page scrolls 250px or more, and otherwise that the page scrolls and the invite line stays pinned.

## 2. The reveal link ("If yes, click here to enter code.")

**An underlined `TextLink`**, not a quiet button. It sits among words, so colour alone does not tell it (D-562's rule, for the app too); and it is a text link that reveals a field, which is what `TextLink` is for. New prop **`isUnderlined`** on `TextLink` (`@pam/ui`): the line all the time; the look otherwise as D-271 (no pill; the accent colour on hover). Ava: `<TextLink label={t('join.code.reveal')} onClick={revealCode} isUnderlined />`. A link standing alone in a row (Back, Sign out, Skip) needs no line and keeps D-271.
