# 2026-10-10 — website: "Planning a visit"

**Branch:** `claude/compassionate-bohr-mzrchf` (main `2dfc73a` merged in) · **Lane:** Website

## What changed

- A new member post, **Planning a visit** (`PlanningAVisit.tsx`, registered in `posts.ts` and `bodies.tsx`), from
  Piper's trips work (D-454 saved trips, D-470 a trip names its service, the cancel and "Past visits" change),
  in the app's own words: plan from Trips → "New trip" ("Pick a program. Your saved ones are first.") or from a
  place ("Pick a service", "Plan a trip"), day and time, "Check your trip", "Add this trip"; change
  ("Change appointment", "Save the new time"); cancel ("Cancel this visit", asks first, "Yes, cancel it" /
  "Keep my visit", with the app's sentence about the reminder); "Past visits" on Trips; policies ("Policies to
  sign", "Sign"); points as one sentence and a link to Points and badges.
- **Reminders follow `VISIT_REMINDERS_LIVE`** (`content/flags.ts`): "coming" today; a one-line-flip text when on.
  The 9 pm timing is not described (Mira); `docs/before-launch.md` tells whoever flips the flag to add one plain
  sentence about it.
- Three pictures from main's Storybook: a place that lists services, "Your next visit", the cancel box.
  There is no story of Trips with a past visit (only an e2e spec, `trips-past`), so "Past visits" is words only.

## What was wrong, and what missed it

- **The Trip-added screen still promises a reminder**: `trips.new.done.body` says "We will remind you the day
  before if text reminders are on" while the flag is off and nothing is sent. Not this lane; flagged (before-launch).
- The brief said there is a Storybook picture of Trips with a past visit; there is not. Found by listing story ids.

## Decisions made

None new.

## Verified

- tsc, site tests 19, normal build, `a11y.mjs` (numbers in the READY note); three pictures read before use.

## Left undone

- A picture of "Past visits" (needs a story). Attended or missed visits are not listed in the app, so the
  post does not say they are. Unchecked: the deployed app.

## Needs a human

- Will: sign the English of About Pam.
