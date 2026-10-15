# 2026-10-15 — design member W3 W5 layout proposals

**Branch:** `claude/pam-design-member-w3-w5` · **Lane:** design system (Dot)

## What changed

Pictures and a patch only, in `docs/design/review/2026-10-15-member-w3-w5/`. No app code changed.
Two proposals from Iris's second pass (`docs/research/2026-10-15-member-flow.md`), for Will:

- **W3:** on a place with services to pick, the "will see your visit" note moves below the
  service cards (`PlaceDetail` `chooseFirst`), so at 320x568 the choices show before the Plan a trip
  button that waits for them.
- **W5:** until the visit is marked, a secondary "How to get there" button sits under the visit
  card; the Get directions row is hidden meanwhile (`place/page.tsx`, `directionsUpTop`).

## What was wrong, and what missed it

W3: the note (4 lines at 320) stood between the heading and the first choice. Nothing measured how
much of the choice list showed above the sticky footer on a short phone.

## Decisions made

None recorded: both are proposals until Will picks. The footer-button alternative for W5 was not
drawn (it would be a second primary, D-239).

## Verified

Before and after shot from Storybook built from main (7b58b1f9) with and without `proposal.patch`:
English 320x568 and 390x844, Arabic 320x568. `build-storybook` passed with the patch applied. The
patch was reverted afterwards; the branch holds no code change.

## Left undone

At 320x568 the W5 button starts just under the fold (the visit card fills the first screen). Cancel
this visit is left for Piper's P6. Medium confidence per Iris: one real member.

## Needs a human

Will picks W3 and W5 independently; Piper builds what he picks.
