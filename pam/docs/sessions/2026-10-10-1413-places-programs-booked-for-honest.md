# 2026-10-10 — places programs booked for honest

**Branch:** `claude/places-programs-booked-for-honest` · **Lane:** Places & programs (Piper)

## What changed

Lena's promise sweep: after a program books a visit for a member (`/program/book/`) the end screen said "Booked for {name}!" and "Pam texted {name} a link" (with the text shown), but `bookTrip` keeps a `forMemberId` booking in the tab only (nothing saved, nothing sent) and the step before already says "Example trips only for now". Chose the small truthful fix: the end screen is now an example and says so (`trips.booked.example.title/.body`, seven languages); the booked/texted/sms strings are kept for the day the booking is real. Removed the now-unused invite link and trip-id state. New e2e `program-book-example`.

## What was wrong, and what missed it

The end screen was written for the finished feature (D-316, D-322) and shipped ahead of it; no test read its words.

## Decisions made

The small fix, not the real one: making the booking real needs a staff-books-for-member function (who a program may book for, the member's reminder consent, and no "texted" claim while texts are off); Nico's texts_live switch decides when any text claim can be true.

## Verified

Web 76, config 1026, tsc clean; e2e new program-book-example (walks the flow, no Booked-for or Pam-texted wording, axe clean) on all three phones.

## Left undone

A real booking for a member. The picker's example people still show a "Booked · Mon…" line; they are example data in an example flow. Policies per service; switching between a lead's programs.

## Needs a human

Nothing.
