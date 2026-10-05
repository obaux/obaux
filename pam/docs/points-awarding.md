# How points are awarded — the spec to build from

Will, 5 October 2026: "Please document the logic for point awarding … to
build later." This is that document. The Points screen (D-278) already
*shows* these rules to members; this says how the database should *award*
them. When the two disagree, fix one of them in the same change.

Status, as of writing: two rules are live (save a place, finish setup).
Everything else here is to build.

## Decide before building (Will and whoever builds it)

Work through these first; each changes what gets built. Record each answer
here (and in DECISIONS.md) and tick it.

- [ ] **Policies:** should signing all of a program's policies earn points?
  Proposed: +10, once per program. Not on the Points screen until agreed.
- [ ] **Return bonus window:** "once per program per week", or should a daily
  class pay the return bonus every day it is attended?
- [ ] **Location at visit time:** are we comfortable asking members for
  location only while a visit is on, to award the checked-in 100? The phone
  would report "was within 150 m" and nothing else.
- [ ] **Rewards:** will points ever be exchangeable for anything (transit
  passes, phone minutes)? `REWARDS_ENABLED` is off; the screen promises
  nothing either way.

And two things found while writing this, to fix as part of the build:

- [ ] **The database's `badges` table** is seeded with an older set
  (`first_visit`, `four_week_streak`, …) than the names the app shows
  (`BADGES` in config). Reseed it before any badge is awarded.
- [ ] **`LEVELS` in config** is a second, unused ladder ("Getting Going", …).
  Delete it, or make it an alias of the core `BADGES`.

---

## Principles (do not trade these away)

1. **The database awards points, never the client.** Every award is a
   trigger or a `security definer` function writing to `points_ledger`. A
   client that grants its own points is a score nobody can trust. This is
   how the two live rules work (0045, 0047); copy them.
2. **The ledger is append-only** (0005, 0007's trigger). A balance is
   `sum(delta)`. Nothing is edited or deleted. A mistake or abuse is undone
   by a new row with a negative `delta` and reason `reversal`, written only
   by an admin function that also writes `audit_log`.
3. **Points are a member mechanic.** Staff (case managers, program leads,
   the super admin) never earn them, even when they do the same thing a
   member does (0045 already checks the role). Every award function checks
   `role = 'member'`.
4. **Every rule is idempotent.** Each award states what it is "once per",
   and a unique index on `points_ledger` enforces it, so a retry, a double
   tap or a replayed webhook can never pay twice (`subject_id`, 0045).
5. **Taking an action back takes nothing back.** Unsaving a place,
   cancelling a trip and unsigning a policy keep the points already
   earned. Rules are built so this cannot be farmed (see "once per").
6. **Honest about proof.** Points follow how sure PAM can be that it
   happened: a program's check-in is worth more than a self-report. The
   member is never accused; a lower-confidence action just earns less.
7. **No comparison** (§8): no leaderboards, no "top members", nothing
   ranking one member against another. `LEADERBOARDS_ENABLED = false`.
8. **Nobody else sees a member's points** except as the transparency
   contract already says (`points_ledger_select_admin`, 0007). The Points
   screen tells members "they are yours and nobody else sees them"; if
   staff visibility ever widens, change `transparency.ts` first.

---

## The rules

What the Points screen lists ("Ways to earn") is marked **on screen**. The
values live in `packages/config/src/points.ts` (`POINTS_RULES`); the
database functions must use the same numbers. Add a config test that fails
if they drift.

| # | What the member does | Points | On screen | Proof | Once per | Status |
|---|---|---|---|---|---|---|
| 1 | Finishes setup | 25 | — | automatic | ever | **Live** (0047) |
| 2 | Saves a place | 5 | yes | automatic | place, ever | **Live** (0045) |
| 3 | Calls a place | 10 | yes | honour (the tap) | place, ever | To build |
| 4 | Plans a trip to a program | 25 | yes | honour (the booking) | program, ever | To build |
| 5 | Shows up to a visit (checked in) | 100 | yes | program check-in or geofence | visit | To build |
| 5b | Shows up to a visit (said so by text) | 60 | (as 5) | SMS "YES" | visit | To build |
| 6 | Goes back to a program again | 50 | yes | as 5 / 5b | program, per week | To build |
| 7 | Program approves their enrollment | 50 | — | program action | enrollment | Later |
| 8 | Completes a task | 10–50 | — | honour | task | Later |
| 9 | Connects with a mentor | 30 | — | automatic | connection | Blocked: mentors |
| 10 | Messages a buddy | 10 | — | automatic | day | Blocked: no buddy system |
| 11 | Refers someone who joins | 100 | — | referral code | person | Later |

### 1. Finish setup — live

`award_points_for_finishing_setup()` (0047): 25 points when `onboarded_at`
goes from null to set, members only, once ever (unique index on
`member_id where reason = 'finish_setup'`).

### 2. Save a place — live

`award_points_for_save()` (0045): 5 points on insert into `saved_places`,
members only, once per place ever (`subject_id = service_id`, unique
`(member_id, reason, subject_id)`). Unsaving takes nothing back; saving
again pays nothing.

### 3. Call a place

- **Trigger:** the member taps a place's Call button (a `tel:` link). The app
  cannot know whether the call connected, so this is honour system.
- **Build:** an RPC `log_call(p_service_id)` called on the tap. It inserts a
  `call_service` row, 10 points, with `subject_id = service_id`, and the same
  once-per-subject index applies. The tap must not wait for it, so fire and
  forget: the phone dialler opens at once.
- **Once per place ever.** Calling the same place again pays nothing, so
  there is no reason to call to farm.

### 4. Plan a trip to a program

"Sign up" in the old wording; in PAM's language a member signs up by
planning a trip (Will, 5 October).

- **Trigger:** a trip is booked through Plan a visit. Today trips are example
  data (`addedTrips`, session storage); this rule needs trips stored as rows
  in `appointments` (`member_id`, `service_id`, `starts_at`, status
  `scheduled`).
- **Build:** an after-insert trigger on `appointments`, reason `plan_trip`
  (rename `self_reported_signup` in config), 25 points, `subject_id =
  service_id`.
- **Once per program ever.** Planning a second trip to the same program pays
  nothing here; going back pays through rule 6. This is also what stops
  "plan, cancel, plan again" farming.
- Keep config's `dailyCap: 3` as a second guard: at most three
  `plan_trip` awards per member per day, in the member's own time zone
  (`appointments.timezone`).

### 5. Show up to a visit

The rule that matters most, and the one worth the most.

- **Verified (100 points, `attend_appointment_verified`):** the appointment
  becomes `attended` with `attendance_method` of:
  - `provider_checkin`: the program enters or scans the visit's
    `check_in_code` (§3.2). This needs a check-in screen for program leads;
  - `geofence`: the member's phone reports a position within 150 m
    (`GEOFENCE_RADIUS_METRES`) of the program, from 30 minutes before
    `starts_at` to 2 hours after. It only checks when the member opens the
    app in that window, never in the background, and the position is not
    stored: only "was within 150 m" is.
- **Self-reported (60 points, `attend_appointment_sms`):** the follow-up text
  ("Did you make it to {program}? Reply YES") gets YES within 24 hours.
  - The message needs `reviewedBy` like every SMS, and must not reveal
    justice involvement.
  - It is sent only if the visit was not already verified.
- **Once per visit,** and never both: one unique index on
  `(member_id, subject_id)` where reason is either attendance reason,
  `subject_id = appointment id`.
  - If the text YES comes first and a check-in later, the 60 stays and the
    check-in adds a row of +40 (`attend_upgrade`). The member ends at 100,
    never 160.
- **Missed visits earn nothing and cost nothing.** No negative points, ever,
  for not going. Sankofa (below) is the badge that welcomes a member back
  after a missed one.
- **Build:** a trigger on `appointments` when `status` becomes `attended`,
  reading `attendance_method` to choose 100 or 60.

### 6. Go back to a program again

Replaces the "weekly streak". Will, 5 October: PAM cannot know how each
program structures its weeks, so it rewards returning, not a streak.

- **Trigger:** an attended visit (rule 5, either kind) at a program where the
  member already has at least one earlier attended visit.
- **Points:** 50 (`return_visit`; rename `weekly_streak` in config).
- **At most one per program per week** (ISO week, in the member's time zone),
  so two check-ins on one day, or a daily class, cannot multiply it.
  Index: `(member_id, subject_id, week)` with `subject_id = service_id` and
  the week stored on the row.
- **No streak, no cap, no reset.** Missing weeks loses nothing; the next
  return still pays. `STREAK_POINTS_CAP` and "50 × consecutive weeks" go.
- **Build:** in the same trigger as rule 5, after the attendance award.

### 7–11. Later

- **Enrollment approved (50):** when a program marks a member enrolled. Needs
  the enrollments flow (`enrollments` exists; approval does not). Once per
  enrollment.
- **Tasks (10–50):** the task row carries the value; honour system; once per
  task. No tasks exist yet.
- **Mentor (30), buddy (10/day):** blocked: PAM models member↔mentor and
  member↔case manager only, and has no buddy system (see `blockedBy` in
  `BADGES`).
- **Referral (100):** when someone the member invited finishes setup. Once per
  person. Needs member-made invite codes, which today only staff create.

### Possible new rule — sign a program's policies (needs Will)

Signing every policy a program asks for (D-270) is exactly the kind of
"getting ready" PAM wants to encourage. A proposal, **not on screen and not
agreed:** 10 points when a member has signed all of a program's policies,
once per program. Ask Will before building; add to "Ways to earn" if yes.

---

## The ladder and badges

### Core ladder (from the balance)

The rungs and thresholds are `BADGES` with `group: 'core'` in config:

| Rung | Points |
|---|---|
| Returned | 0 |
| Rooted | 250 |
| Builder | 750 |
| Provider | 1,500 |
| Pillar | 3,000 |
| Elder | 5,000 (blocked: mentors) |
| Chief | 8,000 (blocked: buddy system, circles) |

- A rung is reached when the **balance** reaches its threshold. The balance is
  only ever added to (apart from a reversal), so rungs are never lost.
- **Build:** an after-insert trigger on `points_ledger` checks whether the new
  balance crossed a threshold and inserts `member_badges` (`earned_at =
  now()`). It must not wait for a nightly job: the member should see the new
  rung when they next open Points.
- **The celebration** (confetti, "New level: Builder") is client-side today,
  from `localStorage`. Once `member_badges` is real, the screen should
  celebrate a `member_badges` row newer than the last one it showed, so it
  works across phones. Add a notification ("You reached Builder") at the same
  time.
- **Two ladders exist in config: reconcile.** `LEVELS` ("Starting Out",
  "Getting Going", …) predates `BADGES` and no screen uses it now (D-278).
  Delete it when building this, or make it an alias.

### Category and one-off badges (from what happened)

These come from activity, not points, so they are evaluated from the rows
that record it (`appointments`, `enrollments`, `saved_places`, …) by the
rule in each badge's `rule`. Run the evaluation:

- **immediately** after the action that could earn it (a trigger), for the
  common ones — first attended visit, first plan; and
- **nightly** (pg_cron), for the ones that depend on time: Sankofa, sustained
  attendance.

Earning a badge does not award points by itself. Points come from the
actions; badges recognise patterns. This stops double-counting.

**The database's `badges` table is out of date.** 0005 seeded an early set
(`first_visit`, `four_week_streak`, `got_my_id`, …), but config's `BADGES`
(Will's names, 14 September) is what the app shows. A migration should
replace the seed with `BADGES`, keyed by `key`, before any badge is awarded.

---

## Anti-gaming, in one place

- Unique indexes make every rule pay once per what it says, whatever the
  client does.
- Members only: staff accounts never accrue.
- Daily caps where config sets them, counted in the member's time zone.
- The highest-value rule (attendance) needs a program check-in or a phone
  that was actually there; the honour version pays less.
- Nothing pays for undoing and redoing: once-per-thing beats cancel-and-
  rebook, unsave-and-save, and calling the same number twice.
- An admin-only `reverse_points(member, ledger_id, note)` writes a negative
  row plus `audit_log`, for real abuse. Members are never told they are
  suspected of anything; points simply stop for the abused rule.

---

## What has to exist first

1. **Trips as real rows** in `appointments` (today: `addedTrips` example
   data). This unlocks rules 4, 5 and 6, which are three of the five on
   screen.
2. **A check-in for programs**: enter or scan the visit's code. Without it,
   only geofence and SMS attendance exist.
3. **The attendance follow-up text** (SMS rule 5b), reviewed copy, after the
   SMS provider items on the before-launch list.
4. **The `badges` migration** (replace the old seed with `BADGES`).

## Build order

1. Config: rename `self_reported_signup` → `plan_trip` and `weekly_streak` →
   `return_visit`; drop `STREAK_POINTS_CAP` and the weekly note; add a test
   that the Points screen's numbers match `POINTS_RULES`.
2. Migration: `badges` reseed; the ladder trigger on `points_ledger`
   (`member_badges`).
3. Migration: `log_call` RPC (rule 3), and the Call button calls it.
4. With trips stored: the `plan_trip` trigger (rule 4).
5. With check-in: the attendance trigger (rules 5 and 6 together).
6. The SMS follow-up and 5b.
7. Points screen: earned badges and the celebration from `member_badges`.

Each step gets a DB test in `packages/db/test/` with one user per role:
- a member earns, and a case manager doing the same thing does not;
- the second identical action pays nothing;
- a member cannot insert into `points_ledger` directly;
- a member cannot read another member's ledger.

Run `pnpm --filter @pam/db test` after each.

## Open questions

Listed at the top, under "Decide before building", so they are seen first.
