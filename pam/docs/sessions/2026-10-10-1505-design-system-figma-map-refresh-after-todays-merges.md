# 2026-10-10 — Design system & Storybook (Dot): the Figma map after today's merges

**Branch:** `claude/pam-design-flow-map-2` (from `main` at 2ea542d) · **Lane:** Design system & Storybook

Mira's ask: refresh the map for what today's merges changed, with the staff rings shown beside the old Home
as a clearly marked proposal, and look at each page and count the fills.

## What changed in the map

All six pages of "PAM — User flows" (`DtlJg9Klx5BRfHbXBhkg98`) redrawn from `flows.mjs` on this branch, 103
real screenshots placed (5 + 13 + 28 + 17 + 23 + 17), each with its Storybook link:

- **Member** (+2 cards): *A place with a visit* (Cancel this visit, which asks first and returns to Trips) and
  *Trips with a past visit*; Points says the four ways Pam pays (D-468, D-472) and that badge names wrap.
- **Sign in:** the changed slides (D-474), and the new Overview counts.
- **Program lead** (+2): *Pam asks for changes* (Edit and send again, D-386 part 5b) and the *Proposed* rings card.
- **Case manager** (+1): the *Proposed (a22)* rings card beside the old Home.
- **Super admin:** unchanged in content (Programs to check and its review page were already in `flows.mjs`).
- A card can be flagged `proposed: true` in `flows.mjs`: a dashed blue outline and "Proposed (a22) · not in the app".
  The two staff Home cards use it; the old Home stays as the app has it.
- **Not drawn:** "Your programs" (the lead's side of Piper's program switch) is not merged; Piper's part 6 likewise.

## What was wrong, and what missed it

- **The shell note ran into the intro, again.** The new, longer note on Case manager and Program lead wrapped
  to three lines and ran into the intro. I only saw it because I looked at the top of every page; shortened it
  (Figma and `flows.mjs`).
- **"Trips with a past visit" does not show the past visit.** The story's picture is the drawer at its opening
  height: three coming-up trips, and Past visits is below it. The card's title says what the note says, not what
  the picture shows. The generator cannot scroll or expand a drawer (its actions are fill, click, wait). Not
  fixed: it needs a story that opens the drawer, or an action that drags it.
- **`upload_assets` was passed `currentPageId` this time** and all 103 responses said which node they placed on,
  checked one by one, then 103 of 103 image fills counted in Figma. (Last time two uploads said success and
  placed nothing.)

## Verified

| Check | Result |
|---|---|
| `build-storybook`, `user-flows.mjs`, `user-flows-figma.mjs` on `2ea542d` + this branch | pass; 6 pages, 103 shots |
| Figma cards drawn | 5 (overview) + 13 + 28 + 17 + 23 + 17 |
| Screenshots placed | 103 of 103 (each upload's `placedOnNodeId` checked); image fills counted per page: 13, 28, 17, 23, 17 (overview's 5 seen) |
| By eye | top of all five flow pages and the Overview; the two Proposed cards, Cancel this visit, Trips, Pam asks for changes, Programs to check |
| App code, tests | not touched |

## Left undone

- *Trips with a past visit* needs a picture that shows the past visit (above).
- "Your programs" and Piper's part 6, when merged. Redraw the program lead and super admin pages then.
- The HTML pages in `user-flows-out/` do not have the wrapped legend (git-ignored; only Figma does).

## Needs a human

- Nothing.
