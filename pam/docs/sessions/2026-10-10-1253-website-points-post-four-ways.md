# 2026-10-10 — website: Points and badges lists four ways to earn

**Branch:** `claude/compassionate-bohr-mzrchf` (restarted from main `717ed79`) · **Lane:** Website

## What changed

- "Points and badges" said two ways to earn points are live; main now pays four (`AWARDED_TODAY` in
  `packages/config/src/points.ts`): Save a place +5, Finish setting up Pam +25, Plan a trip to a place +25
  (once per place, up to three new places a day, D-468), Call a place +10 (the first time you tap Call on that
  place, up to five new places a day, D-472). The table, the sentence under it ("these four"; Pam cannot tell
  whether a call connected, so it counts the tap), the file's header comment, and the picture and its
  alt text (the Points screen's four rows, in the screen's order) are updated.
- A test (`test/about.test.ts`) fails when `AWARDED_TODAY` changes length or a way's points are missing from the
  post, so the next rule that ships cannot leave the post stale unnoticed.
- Other posts checked for points: Joining Pam, One phone two sides, Pam words (the level), What others can
  see, Who is my guide: nothing counts ways to earn; no change.

## What was wrong, and what missed it

- The post named "two ways" by hand and nothing connected it to the config. It went stale twice in a day
  (once when the Points screen changed, once now). The test above is the first thing to connect them.

## Decisions made

None new.

## Verified

- Site tests 19, tsc, normal build, `a11y.mjs` (numbers in the READY note); the picture from main's Storybook
  (`member-created--points`), read before use: four rows, +25, +10, +5, +25.

## Left undone

- "Planning a visit" (Mira's step 3) is not written: Piper's Cancel + past trips has not landed on main
  (no cancel in `TripsView.tsx`, no decision or session log for it). Waiting for Mira to say when it does.
- Unchecked: the deployed app.

## Needs a human

- Will: sign the English of About Pam.
