# D-545 — A place that is not a program on Pam offers only what works for any place

**Date:** 2026-10-12 · **Branch:** `claude/places-programs-scraped-vs-pam` (and `claude/places-programs-im-here` for the held parts)

**Decided by:** Will, 12 October 01:03, relayed by the merge desk: "programs scraped from the internet and also programs created in
Pam. We need different approaches. We don't offer all those functionalities, those capabilities, for scraped programs."

A place is **on Pam** when `service_has_lead` is true (an organisation with an active provider account, D-498). Everything else is
gathered from a public list.

## The audit (member, a place with no lead)

| Capability | Shown for a scraped place today? | Should it be? | What was done |
|---|---|---|---|
| Details, About, address, hours, "Hours on Google" | yes | yes | stays |
| Directions, Call, Website | yes | yes | stays |
| Save, Share, Flag something | yes | yes | stays |
| Plan a trip for yourself, change/cancel it, the day-before reminder | yes | yes | stays; its wording already says the plan is only theirs (D-498) |
| "This is only to help you plan. Pam does not tell {place}…" | yes | yes (it is the honest line) | stays |
| Messaging the program: the ⋯ item "Message the program" and the row "Send a message" | yes (both opened Messages) | no | Nico's (separate branch) |
| Policies to sign (row, card, Trips badge) | no: they exist only where a program put them in the database | only there | no change; a scraped place has none |
| What this program offers (services), drop-in schedule | no: `program_services` and schedules exist only for programs on Pam | only there | no change |
| The program's staff badge on a booked visit | no: examples only | only there | no change |
| "The program sees your visit" (`place.lead.sees`, `trips.booked.hasLead`) | no (held branch: shown only when `hasLead`) | only there | already gated |
| "I'm here" / "I went" on the visit page, and the points they pay (held) | would show, and the database would pay | no | held branch: hidden when there is no lead, and the database refuses (`NO_LEAD_HERE`) |
| "Missed" / "Not marked as there" on a past visit (held) | no: the nightly sweep already skips places with no lead | only there | no change |
| Program lead's card, a lead's Home, program tools | not reachable from a place | n/a | no change |

Nothing on the place page of live `main` needed a code change other than the two message rows, which Nico owns. The e2e
`place-scraped-vs-pam.spec.ts` pins the set.

## Wording left for Sage

The About heading says "About program" for every place. For a place that is not on Pam, "About this place" would not suggest a
program runs it. Not changed here; Sage to decide.
