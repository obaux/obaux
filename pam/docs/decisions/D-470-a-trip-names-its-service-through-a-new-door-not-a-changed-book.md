# D-470 — A trip names its service through a new door, not a changed book_trip

**Date:** 2026-10-10 · **Branch:** `claude/places-programs-trip-service`

**Decided** by the CTO's brief (Mira, 10 October 2026: "if it fits without a signature change… otherwise the contract step"), built by Piper; the choice of door is below and can be reversed.

**What.** A trip can name the program service it is for (`appointments.program_service_id`, nullable, set null if the service is removed). It is written only by a new function, `book_trip_at_service(place, time, service, note, zone)`, which holds the whole booking body and the plan_trip points. `book_trip` keeps its exact signature and now calls it with no service. `my_trip_services()` says which service each of the caller's trips is for, because `my_trips()`'s result cannot gain a column without a DROP.

**Why not change `book_trip`.** A fifth parameter with a default makes `book_trip(...)` ambiguous with the old four-parameter one for every caller PostgREST resolves by name, and removing the old one is a DROP: the live connector hangs on those (D-387) and the deploy window would have no function. A new door is pure expand: the live app is untouched, and nothing needs sequencing.

**What a later session might do.** When the app calls only `book_trip_at_service`, drop the old `book_trip` in its own `-- contract:` migration (manual SQL for Will's editor). Policies per service (D-313's second step) are separate.
