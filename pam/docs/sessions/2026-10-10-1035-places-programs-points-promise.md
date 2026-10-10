# 2026-10-10 — places programs points promise

**Branch:** `claude/places-programs-points-promise` · **Lane:** Places & programs (Piper)

## What changed

The Points screen's "Ways to earn" was listing six ways; Pam pays two (save a place, 0045; finish setup, 0047). Wren found the gap. `AWARDED_TODAY` in `packages/config/src/points.ts` now names what is paid; the screen filters its list by it, and a config test pins it. The unpaid rows stay written in `points/page.tsx` and return when their reason joins the list. New string `points.way.setup` in seven languages. `docs/points-awarding.md` gains a Proposal section (which earnings to make real now trips are saved). No migration.

## What was wrong, and what missed it

The screen listed rules from the spec as if live. Nothing tied the screen to what the database pays; now a test does (the list of paid reasons), though it cannot read the database, so it is a reminder, not proof.

## Decisions made

None yet. The proposal needs Will: plan a trip first (25, once per place ever, inside `book_trip`), then call a place (10).

## Verified

tsc clean; config 995 and web 71 tests pass; Storybook builds; the member Points story shows Save a place +5 and Finish setting up Pam +25; fit audit 0 new in seven languages; pseudo shows 10 ellipsis hits on badge names in the ladder, 3 not yet accepted, none from this change (it only removes rows).

## Left undone

The earnings themselves. Figma flow map unchanged (no screen added).

## Needs a human

Will: approve the proposal in docs/points-awarding.md (plan a trip once per place ever vs once per program; call a place next).
