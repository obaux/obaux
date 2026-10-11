# 2026-10-11 — attendance part C: missed visits

**Branch:** `claude/places-programs-attendance-c-missed` (on part B) · **Lane:** Places & programs (Piper)

## What changed

Migration `20261011053445`: `sweep_missed_visits()`, nightly at 04:20 UTC through pg_cron (skipped with a notice where there is none). A visit still `scheduled` 24 hours after it ended (`ends_at`, or an hour after start) becomes `missed`, only at a service whose organisation has an active provider (the `service_has_lead` test); never cancelled or attended. Service role only. One audit row with a count. Pays nothing, takes nothing, texts nobody. `check_in_visit` already accepts a missed visit for 14 days.

## What was wrong, and what missed it

Nothing marked a visit missed, so a program's list never showed who did not come.

## Decisions made

D-526 (no new ones).

## Verified

Whole DB suite with test 58: the two visits at a program with a lead are marked; one ended 20 hours ago, a cancelled, an attended, one at a paused lead, one at a place with no lead, one still to come are not; no point moved; no reminder or notification; a second night finds nothing; the lead's here on a missed visit pays 100; a lead and anon cannot run the sweep.

## Left undone

Part D (member Trips line, guide marks). Visible change: `my_program_visits` already returns `status = 'missed'`, so a program lead now sees "missed" status for these visits; Privacy and Lena's contract test say "marked you as there" only and need the word.

## Needs a human

Mira: apply `20261011053445` after `20261011051257`. Lena: the Privacy line.

## Part D, member side (same branch)

Trips now keeps attended and missed visits (it used to drop everything but scheduled, so a checked-in visit would have vanished): a past visit says "Checked in" (existing string) or "Not marked as arrived" (new `trips.notMarked`, English in all seven files until Will signs, with an allow-entry in the copy test). A past visit nobody has marked yet (within the day) says nothing. `TripCard` takes an optional `mark`. Unit test and an e2e in `trips-real-account.spec.ts`.
