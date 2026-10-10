# 2026-10-10 — places programs trip points

**Branch:** `claude/places-programs-trip-points` · **Lane:** Places & programs (Piper)

## What changed

`book_trip` (same signature) now pays 25 points, reason `plan_trip`, once per place ever, three a day, members only (migration `20261010115117`, expand only). Config renames `self_reported_signup` to `plan_trip`; the Points screen lists it as "Plan a trip to a place" (reworded in seven languages, since any place pays). Spec updated. Not done: `program_service_id` — it needs a new `book_trip` parameter, so it is its own contract migration next.

## What was wrong, and what missed it

Nothing found wrong. On clean main the database suite already fails two checks that are not mine: `04_rpc_test` "an available member was not claimed" and a `profiles_phone_key` collision before `28_saved_trips` runs (FINDING sent to Mira).

## Decisions made

D-468.

## Verified

Database test 32 (all checks ok): pays 25; cancel keeps it; cancel and re-plan pays once; moving pays nothing; fourth new place a day pays nothing but is saved; another member sees none; a member cannot write the ledger; a lead cannot plan and earns nothing. Config 997, web 71 pass; tsc clean; Storybook builds; fit audit 0 new in seven languages (pseudo as before).

## Left undone

`program_service_id` on trips; call-a-place points (`log_call`); live data not touched.

## Needs a human

Mira applies the migration at merge.
