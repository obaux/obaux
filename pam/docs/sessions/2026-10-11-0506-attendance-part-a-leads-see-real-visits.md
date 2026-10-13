# 2026-10-11 — attendance part A: leads see real visits

**Branch:** `claude/places-programs-attendance-a-visits` · **Lane:** Places & programs (Piper)

## What changed

Part A of a56 (Will: "go"). Migration `20261011050637`: `my_program_visits(from, to)`, a program lead's own program only, member first name only. App: `useProgramVisits`; the lead's Home lists the real visits (service name as the label, "Visit" when none, new `schedule.kind.visit`); `Appointment.href` is optional and a real visit's name is not a link.

## What was wrong, and what missed it

A member's visit at a program was a row the lead could read but not name (the profile read rule keys on enrollments, not the program's org), so Home showed only examples and visits the lead booked themselves.

## Decisions made

D-526 (the whole attendance plan, parts A–D).

## Verified

Whole DB suite (new test 56: two coming up and one past, not the cancelled one, not past the window, not another program's; first name only; the service and the check-in shown; another lead sees only theirs; a member, a super admin, a limited lead and anon refused). Config 1041, web 119, tsc, Storybook build, e2e program-visits, staff-home, places-without-a-lead, a11y pass on three phones.

## Left undone

Parts B (check-in + points), C (missed), D (screens). The new string "Visit" goes to Sage.

## Needs a human

Mira: apply `20261011050637`.
