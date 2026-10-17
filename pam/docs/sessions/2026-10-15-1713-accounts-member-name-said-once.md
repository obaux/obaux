# 2026-10-15 — accounts member name said once

**Branch:** `claude/pam-member-name-once` · **Lane:** Accounts & invites

## What changed

- Iris re-tested b43: the case manager pass is a PASS on every item. One polish note came out of W3 and P8. A member's
  page now has their name as its title (h1), and the profile card under it said the name again as an h2. A screen
  reader read "Marcus, Marcus".
- `ProfileSummary` (`packages/ui/src/ProfileCards.tsx`) takes `isNameInTitle`. When it is set, the card still shows
  the name, the same size and weight, but as a paragraph, not a heading. The person page sets it whenever the title
  is the name. The user's own Profile is unchanged: its title is "Profile", so the card's name stays a heading.
- The program lead's small member card (`ProgramMemberCardView`) already had one heading with the name. D-580 removed
  its duplicate. Its test now checks that the name is one heading.
- New story: Components/Cards/ProfileCards › NameInTitle.

## What was wrong, and what missed it

- W3 put the name into the title, but the card's DataHeading kept it as well. No test counted the headings with the
  name. `connect-examples-only.spec.ts` even used the card's h2 as its "page loaded" check. It now waits for the h1.

## Decisions made

- Keep the name on the card instead of dropping it. Dropping it would leave an avatar with no name beside it. A
  paragraph looks the same and is read once. Too small for a decision file.

## Verified

- `tsc` is clean and `@pam/ui` tests pass (124).
- After build:e2e, these specs pass on all three projects, 375 tests: case-manager-pass, program-visits, people-strip,
  person-real-trips, connect-examples-only, messages, profile-skeleton and a11y.
- In the Storybook build, the name in the Default and NameInTitle stories has the same computed font, size (26px),
  weight (700) and height (31px). Only the tag differs: h2 or p.

## Left undone

- Nothing.

## Needs a human

- Nothing.
