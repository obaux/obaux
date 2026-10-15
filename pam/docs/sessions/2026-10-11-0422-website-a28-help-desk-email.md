# 2026-10-11 — website: A28 help desk is email, two new posts, Iris's findings

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Public website (Wren), job from Will via the merge desk ("A28 READY", 03:11–03:42 UTC)

## What changed

- **Still stuck?** is Sage's signed A28 text with hello@joinpam.org (mailto and selectable text, `HELP_EMAIL`). The Support page ends with it; an empty search says "We do not have an article for that yet." above it. The old "Still need help? … Open Pam" card is gone. No form (waits for Nico's switch, off).
- **Posts:** `cant-sign-in` (without the "When Add my program ships" block) and `your-safety` (`stillStuck: false`, write-in third after 911 and 988). Phrases mapped; `search-phrases.ts` and `help-centre-gaps.md` updated.
- **`test/no-calls.test.ts`:** fails on "call Pam" and on any `tel:` but 911 and 988 in `src` and `public`.
- **Section labels** from Sage's `section-labels.ts` drive the menu (`lib/section-label.ts`), full heading as the fallback.
- **Texts from Pam:** the saved-place text is held as not yet (`PLACE_TEXTS_LIVE`, off).
- **Iris's findings:** S1 (A28), S2 (focus ring in `globals.css`), W1 (her list run; "lost my phone", "change my number", "password" fixed), W2 (`?q=`; `SearchPill` has an optional `initialQuery`), W3 (font preload after build: 0.23 → 0.04), W4 (`lib/tap.ts`, 48px), W5 (path stops at Support on a phone), W6 (count announced, search landmark, skip link, Esc clears). `scripts/usability.mjs` checks them in a browser.

## What was wrong, and what missed it

- **Astryx's focus outline never showed.** Every link, button and the search box had `outline-style: none` winning over Astryx's own `:focus-visible` rule. Nothing in the repo's checks looks at focus; Iris's keyboard pass found it, and the browser script now guards it.
- **The font swap shifted the page** (0.23 on one post, 0.1 on another) on a cold load; no test measured layout shift.
- The messages post's picture shows the app saying "Questions? Call Pam." (`messages.blocked.theirs.body`): held, not shipped.

## Decisions made

D-522.

## Verified

See the READY message for the numbers (site tests, typecheck, build, a11y, scrollspy, usability, build-storybook).

## Left undone

- `messages-in-pam/blocked.png`: retake after Lena changes `messages.blocked.theirs.body` (and the other app strings that still say "Call Pam", listed in the READY).
- Texts from Pam: Sage's line for "Texts Pam does not send yet" about a saved place closing.
- Section labels for case-manager-assignments, keeping-your-listing, the rules post, cant-sign-in, your-safety, is-the-place-told (asked of Sage).
- The form version of Still stuck? (Nico's switch).

## Needs a human

Nothing.
