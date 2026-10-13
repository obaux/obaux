# 2026-10-13 — messages explore bell only with notifications

**Branch:** `claude/messages-explore-bell-only-with-notifications` · **Lane:** Messages & notifications (Nico)

## What changed

`HeaderBell` gets `hideWhenEmpty`; a member's Explore uses it (D-548). Starts hidden, shows when the real list is non-empty; follows /notifications/ for examples. D-549 is a duplicate claim, unused. e2e `explore-bell.spec.ts` (hidden when empty, shown with one, case manager keeps it).

## What was wrong, and what missed it

## Decisions made

## Verified

tsc, web unit tests 139, new e2e in three projects, full e2e.

## Left undone

## Needs a human
