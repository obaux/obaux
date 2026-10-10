# 2026-10-10 — places programs cancel trip

**Branch:** `claude/places-programs-cancel-trip` · **Lane:** Places & programs (Piper)

## What changed

A member can cancel a coming-up visit from the place page ("Cancel this visit", asks first): a saved one through `cancel_trip`, an example or this-tab one kept off the lists for the session (`cancelTripHere`). Trips splits visits at the current time: coming up stays on the map and in the count; earlier ones sit under "Past visits", most recent first, with no policies to sign. New copy (7 strings) in all seven languages — written as drafts by me because the suite fails on a missing key; Lena should review them. A story, "A place with a visit".

## What was wrong, and what missed it

Checked the reminder, as asked: `sync_trip_reminder` already cancels the queued day-before text on cancel and re-times it on move, and test 28 covers both. Nothing to fix in the database, so no migration. New test 35 attacks the edges (two trips, a sent text, cancel twice, move after cancel, moved close then cancelled).

## Decisions made

None new.

## Verified

Whole database suite passes (35 new). Config 997, web 74, tsc clean; place, visit-change (new cancel test), trips-past (new, past list + saved cancel), trip-booked, saved, a11y and points e2e pass on all three phones (132). Fit audit: 0 new in seven languages; pseudo shows the pre-existing Trips defects plus one accepted message-preview ellipsis.

## Left undone

Attended and missed visits are still not listed (only scheduled ones). Figma flow map not touched: no screen added. Cancel for a program-booked visit (D-316) is not offered.

## Needs a human

Lena: read the seven new strings (place.visit.cancel*, trips.past.title).
