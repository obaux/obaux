# 2026-10-11 — places, explore and saved without examples

**Branch:** `claude/places-programs-no-examples-places` (stacked on `claude/places-programs-trips-launch`) · **Lane:** Places & programs (Piper)

## What changed

Mira (03:02): the Trips rule is app-wide for launch. Applied the one switch (`lib/examples.ts`, D-509) to the rest of the group: `useServices` and `usePolicies` start empty and hold the example sets only in a demo or Storybook; the place page treats an example place link (`dummy-place-…`) as not found for a real account; Reported places shows example reports only in a demo; Saved's starred people list drops the example people; Connect (programs to connect to) shows none when it cannot load; a lead's Book for a member and Add a person use the lead's own program (and its people list is empty until real people exist) instead of the example program. Already right and left alone: Explore's places (real), Saved's places (real; `savedPlacesDemo` runs only for a demo role), PlaceBarActions (matches example names only), ProgramView (a real lead with no program never reaches the example), SavedByView and person pages (keyed by example people), MemberPoliciesView/person/policies (name fallbacks only), `usePlaceHasLead` (example names only).

## What was wrong, and what missed it

The same default as Trips: examples were the starting state of every hook. A real lead's Book for a member would have started a trip at the example program.

## Decisions made

D-509 (extended; no new decision).

## Verified

tsc, Storybook build, fit audit on Explore, Saved and Program lead stories in seven languages plus pseudo: 0 unaccepted. Full e2e: 1169 passed and 30 failed on the first run, all example-dependent specs (messages reported places, policies, program-book-example, trip-booked) and failed-load (D-495, in my tree only); the specs now opt in to the demo set and pass (60/60 re-run). New e2e no-examples-for-real-accounts (3).

## Left undone

Messages, notifications and connections are Nico's. The super admin Reported places screen has no e2e of its own; its gate is one line.

## Needs a human

Nobody.
