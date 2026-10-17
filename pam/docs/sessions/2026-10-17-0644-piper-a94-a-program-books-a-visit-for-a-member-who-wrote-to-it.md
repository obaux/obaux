# 2026-10-17 — Piper a94 — a program books a visit for a member who wrote to it

**Branch:** `claude/places-programs-a94-booking` · **Lane:** Places & programs (Piper)

## What changed

- Database (three migrations, each its own commit, plus test 76): `appointments.booked_by_org`; `book_visit_for_member`
  (eligibility = wrote, signed rules, signed up or planned a visit there, per Mira's 06:11 correction; rate limit, one place per program); `my_trip_booked_by()` for the member; the `visit_booked_for_you`
  bell kind. A contract line was added to the first migration afterwards (a test demands one when a check is dropped).
- App: `bookTrip` calls the real function for a real lead and member (the example path stays for demos); the lead's
  confirmation says "Booked for {name}!" and the "Example trips only for now" ending is gone for a real booking; Trips and
  Explore say "Booked for you by {program}"; the bell row says who and when, in the member's language; the case manager's
  member page and Past visits say "Booked by {program}".
- The case manager's line is one switch: `BOOKED_BY_SHOWN_ON` in `lib/bookedByLine.ts` (`'every'` / `'missed'`), read through
  `showsBookedBy(visit)`. Ava's Home line (a93) should call the same function; `useMemberTrips` now carries `bookedByProgram`
  and `missed`.
- Four English-stand-in keys in all seven locales (`trips.bookedForYou`, `person.trip.bookedBy`,
  `notify.visit_booked_for_you`, `notify.kind.visit_booked_for_you`), acknowledged in the ledger: Sage to sign, Lena to translate.
- D-595, a changelog fragment, `e2e/program-books-for-member.spec.ts` and a case in `person-real-trips.spec.ts`.

## What was wrong, and what missed it

Nothing was wrong; the booking was an example by design (D-316). One thing to know: the member's page lists only attended
visits (W5), so in `'missed'` mode "Booked by" would have nowhere to appear on it; it belongs on the Home line (a93).

## Decisions made

D-595. A right-now desk booking is covered by the program's check-in and reads to the member as an ordinary visit.

## Verified

`@pam/db` suite (test 76), `@pam/config` tests, `tsc`, and the e2e specs in all three projects. Pictures in
`docs/research/shots/2026-10-17-piper-a94-*` at 320 and 390, English and Arabic: lead's check step and confirmation, member's
Trips, Explore, bell, the cancel dialog, and the case manager's member page.

## Left undone

- Pictures of the program's own list showing the visit after booking (unchanged by this card).
- Missed-visit "Booked by" on the member page (see above).
- Sage's wording and Lena's translations of the four keys. The bell body ("{place} booked you a visit: {when}") is the one to read twice.

## Needs a human

- Will: "every booked visit" or "only missed" (`BOOKED_BY_SHOWN_ON`).
- Mira: apply the three migrations live after `list_migrations`; ship with Lena's signed Privacy line.
