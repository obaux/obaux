# 2026-10-12 — messages no lead no message

**Branch:** `claude/messages-no-lead-no-message` · **Lane:** Messages & notifications (Nico)

## What changed

On a place with no lead on Pam, a member sees no Send a message row and no Message the program menu item. `usePlaceLead` (true/false/null while asking) added beside `usePlaceHasLead`; the page waits for it. `PlaceBarActions` takes an optional `messageHref`. Same code D-541 part 2 uses, so it rebases cleanly. e2e `place-no-lead-no-message.spec.ts`; `place.spec.ts` updated.

## What was wrong, and what missed it

## Decisions made

D-544.

## Verified

New e2e (3 projects), full e2e, tsc.

## Left undone

## Needs a human
