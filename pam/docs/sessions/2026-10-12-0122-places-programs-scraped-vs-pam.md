# 2026-10-12 — scraped places and programs on Pam

**Branch:** `claude/places-programs-scraped-vs-pam` · **Lane:** Places & programs (Piper)

## What changed

- The audit of the member's place page for a place with no lead (D-545): the table is in `docs/decisions/D-545-…`.
- `e2e/place-scraped-vs-pam.spec.ts` pins the set a scraped place offers (and that a place with a lead keeps its message item).
- The held I'm-here branch: "I'm here"/"I went" hidden with no lead, and refused by the database (`NO_LEAD_HERE`), test 59.
- This branch carries Nico's `claude/messages-program-before-booking` merged in, because the two message rows are his (D-541).

## What was wrong, and what missed it

Live `main` showed two rows that open a conversation with a program that is not on Pam: the ⋯ item and the "Send a message" row. Nothing
else on the page needed a change; policies, services, drop-in and staff come from data only a program on Pam has.

## Decisions made

D-545.

## Verified

See the READY message.

## Left undone

"About program" is the heading for every place; Sage may want "About this place" for a place not on Pam.

## Needs a human

Nothing.
