# 2026-10-17 — accounts lead expect row 5

**Branch:** `claude/pam-lead-expect-row5-a92` · **Lane:** Accounts & invites

## What changed

- Will signed card a92. A program lead's "What to expect" on Join gets its fifth row, `join.privacy.provider.5`:
  "When a member who signed up with your program saves a new place, you see when. Never which place."
- The branch is cut from main 807db3c1 and stacked on Lena's `claude/lena-program-saves-held` (tip d0872818, so
  b7366b52 is in). Her branch carries the words in seven languages, and both go out in b51.
- `PROVIDER_EXPECT` gets a fifth picture: `alerts`, the existing bell ("Pam tells you when"). No new art, so Dot
  had nothing to draw. ImageryGallery's note for `alerts` names the new place.
- This replaces my held branch `claude/pam-lead-expect-row5` (572ed044), which carried an English-only key from
  before Lena's translations. That branch can be dropped.

## Verified

- New e2e in `join.spec.ts`: a program lead's What to expect has five rows, and the fifth reads the signed line. On
  the old code it failed (4 rows, built and run); on the new code it passes.
- After build:e2e, join and a11y pass on all three projects: 123. `@pam/config` 1328 passed and web `tsc` is
  clean.
- Story: Onboarding › Staff privacy step › Program lead, invited shows the five rows. Pictures at 390, 320 and in
  Arabic are in `docs/design/review/2026-10-17-lead-expect-row5/`, five rows in each.

## Left undone

- Nothing.

## Needs a human

- Nothing.
