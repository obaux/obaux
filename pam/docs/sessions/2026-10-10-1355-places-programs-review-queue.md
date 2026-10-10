# 2026-10-10 — places programs review queue

**Branch:** `claude/places-programs-review-queue` · **Lane:** Places & programs (Piper)

## What changed

Part 6 of the program review. Database, two expand-only migrations: `20261010134145` (`review_program_submission`, `programs_to_check()`, a trigger closing a first-time submission when its listing goes live by any path) and `20261010134146` (the backfill of the six org-owned programs on file with no record, idempotent, plus closing any left open on a live listing). App: `/programs/review/` (the list) and `/programs/review/item/?id=` (a page per program: what was sent, Approve, Ask for changes with a required note, Discard for a withdrawn one), reached from a Profile row and one row on Requests (Ava's lane's file: that one MenuList and its import). Mock, five stories, prototype routes, flow map, 38 strings in seven languages (drafts by me for Lena). Decisions D-479.

## What was wrong, and what missed it

Two things surfaced by the suite. Test 30 counted every submission, and the backfill (rightly) gives the seeded org programs one, so it now counts its own. And a test that wrote prose onto a live listing tripped 0020 (`needs_review` back on), so the test clears it after, as the real program had been approved long ago.

## Decisions made

D-479.

## Verified

Whole database suite passes (new test 40: only a super admin decides; approve from in review only; first listing live; a change applies exactly four fields and leaves description and phone; note required and short; discard only withdrawn; the list shows a first name and no contact column; a hand-written approval closes the submission; backfill writes one row each, none for a listing with no organisation, and is idempotent). Web 82 tests (+6), config 1015, tsc clean, Storybook builds, 5 stories checked in the browser, fit audit 0 new in seven languages and in pseudo. E2E: new programs-review spec (5 tests) and admin, account, a11y, directory: 180 passed on all three phones.

## Left undone

Part 5b (the leader's screen reads their submission and the note, and can re-send after a change request: until then a leader who is asked for changes has no way to send again). Message the leader from the review page. Approval text and bell row (both need Will). Figma flow map not republished.

## Needs a human

Lena: the 38 strings. Mira: apply both migrations, then the backfill is the six live programs. Will: nothing.
