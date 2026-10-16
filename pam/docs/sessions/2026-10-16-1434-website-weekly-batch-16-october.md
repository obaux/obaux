# 2026-10-16 — website weekly batch 16 october

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** website

## What changed
- Points and badges: the picture (`points-and-badges/points.png`) is re-shot from Storybook's example person and now shows all six Ways to earn (I'm here, I went, Plan a trip, Call, Save, Finish setting up); cropped at 770px, was 655. Its alt text names the same six. The post's table already had the six rows (Mira's b42 fix).
- The site's own button border is gone: `SecondaryButton.tsx` is deleted and the Support screen's "Did you mean" buttons are the design system's `Button variant="secondary"` (its edge is the ring, D-493) with the 48px tap style. Measured 48px tall at 390, light and dark.

- Sage signed the two additions (ledger fef92f08, A29): Staff requests (a draft, so not on the live site) gets step 5 (“Pam asks you to confirm. Tap “Yes, approve” or “Yes, deny”, or tap “Not yet” to go back.”) and a paragraph on what the screen says after, in her wording; Is the place told gets “After a check, the place may be taken off Pam’s list.”

## What was wrong, and what missed it
- Nothing new. The picture had been stale since D-578.

## Decisions made
None new; D-493 already decided the button.

## Verified
Fresh build with the stub env: tsc 0, site tests 0 (100), build 0, a11y 0 (120 scans, 0 problems), usability 0, scrollspy 0. Before and after pictures in `docs/design/review/2026-10-16-weekly/`.

## Left undone
- Carried: "Adding your program's policies" post (part 4 waits for card a31), the rules post pictures, the 10 October posts.
- Held for Will: the new-number post (D-571, patch 92db83ab) and Join as a case manager (patch 48528f05), both for a84.

## Needs a human
Sage to sign the two additions. Will for a84.
