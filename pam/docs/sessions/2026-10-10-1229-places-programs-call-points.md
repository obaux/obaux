# 2026-10-10 — places programs call points

**Branch:** `claude/places-programs-call-points` · **Lane:** Places & programs (Piper)

## What changed

`log_call` (migration `20261010122206`, expand only) pays 10 points once per place, five places a day, members only. The place page listens for a tap on a `tel:` link and calls it (`lib/logCall.ts`), fire and forget. Config: `call_service.dailyCap` 5, `AWARDED_TODAY` gains it, so the Points screen's existing "Call a place +10" row now shows. Spec updated.

## What was wrong, and what missed it

I first put an `onSelect` on the Call row. It never fired: Astryx's `Item` ignores `onClick` when a row has an `href`. A new e2e test (tap Call, expect `log_call`) caught it before any code shipped; the fix is the document listener.

## Decisions made

D-472.

## Verified

Whole database suite passes (test 34 new: pays once, same place nothing, sixth new place nothing, unapproved/unknown place refused, staff ignored, nobody signed in refused, cannot write the ledger). Web 73 tests (+2 logCall), config 997, ui 117, tsc clean; place and places e2e pass on all three phones including the new tap test.

## Left undone

Dropping the old `book_trip` later; policies per service; Storybook/fit untouched (no copy or layout change).

## Needs a human

Mira applies the migration at merge.
