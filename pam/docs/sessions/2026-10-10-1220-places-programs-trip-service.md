# 2026-10-10 — places programs trip service

**Branch:** `claude/places-programs-trip-service` · **Lane:** Places & programs (Piper)

## What changed

`appointments.program_service_id` and a new door `book_trip_at_service` (D-470); `book_trip` keeps its signature and delegates; `my_trip_services()` reads the service back. App: `bookTrip` names a real service to the database, saved trips carry `serviceId`/`serviceName`; the story mock answers the two new calls. No screen changes: the booking screen already offered a program's real services.

## What was wrong, and what missed it

Nothing found.

## Decisions made

D-470: a new door instead of a changed `book_trip`, so it is pure expand (no DROP, no ambiguity).

## Verified

Whole database suite passes (test 33 new: old door unchanged, service kept, other program's service refused, nobody writes the column, a removed service leaves the trip). Web 74 tests, tsc clean.

## Left undone

Dropping the old `book_trip` (a later contract); `log_call`; policies per service.

## Needs a human

Mira applies the migration at merge.
