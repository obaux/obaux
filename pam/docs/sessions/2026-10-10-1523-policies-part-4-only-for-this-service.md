# 2026-10-10 — policies part 4: only for this service

**Branch:** `claude/places-programs-policies-p4` · **Lane:** Places & programs (Piper)

## What changed

Policies P4 (D-485). Stacked on P3. Migration `20261010151302`, expand only: `program_policy_services` (which services a policy is ONLY for; no rows = everyone), `set_policy_services` (lead of that program, current policy only, services must be the program's), and `add_policy` replaced (same signature) so a new version keeps the old one's services. App: real program services carry their policy ids; the service editor now loads the lead's real services, offers the program's real policies, and saves the ticks through `set_policy_services`; a member's policy list for a real place filters by the service booked.

## What was wrong, and what missed it

The service editor never asked for the lead's real services, so a real service opened as "New service", and it hid the policy ticks for any real program. Nothing exercised it until the e2e did.

## Decisions made

D-485.

## Verified

Whole database suite passes (new test 49). Config 1047, web 94, tsc clean. e2e: program-policies (7 incl. the new ticking test), member-signs-policy, policies, a11y, place, trip-booked, visit-change all pass on three phones.

## Left undone

Real "booked for member" (a Will card). Lawyer review (docs/before-launch.md). Lena's review of the draft translations. No new strings in P4, so no fit audit was needed.

## Needs a human

Mira: apply `20261010151302` after P3's. Your three small fixes are in part 3 (the cap fix is kept here, in add_policy).
