# 2026-10-14 — places-programs one search, take two (no switch)

**Branch:** `claude/places-programs-one-search-pictures` · **Lane:** Places & programs (Piper)

## What changed

Pictures and a note only (`docs/research/one-search/v2-*.png`, `take-two-no-switch.md`): one bar, one line; one list of programs, areas and addresses; no switch; the area shown on the list.

## What was wrong, and what missed it

Found while checking the privacy rule: today's `wantsGoogle` also asks Google when Pam's own areas find nothing, which with one box would send program words ("food"). The new rule must drop that clause and add "no program matches". Written up, with how it fails safe.

## Decisions made

None; recommendations and three questions are in the note.

## Verified

Looked at each picture; read `streetSearch.ts` and the signed Privacy line. No app code changed.

## Left undone

The build, if Will says go.

## Needs a human

Will: the questions. Sage: stand-in words and the explicit-row sentence. Lena: whether p7's "a place Pam's own list doesn't have" should be tightened.
