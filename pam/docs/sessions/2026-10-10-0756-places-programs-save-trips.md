# 2026-10-10 — Places & programs: save a member's trips for real (D-454)

**Branch:** `claude/places-programs-save-trips` · **Lane:** Places & programs (Piper)
**Job:** Will, 10 October (north star: "Pam is an app that conveniently messages people to make it easy to help them access and get reminded about services"), via Mira: a trip a member plans lives only in the browser tab, yet the done screen promises a reminder the day before — save trips so the reminders can come. One reminder, the day before (Will: "I trust you're looking out to make Pam a very great app to use"; Mira decided option A).

## What changed

- **Three wording fixes first.** A sent program no longer promises "1–2 days" (it said that with no review queue behind it): "Pam checks each one by hand". `/interested`'s empty state spoke in a case manager's words; it now says what is true for a program. The review wait's "Text me when it's live" row is gone: its link led to "Coming soon" switches because nothing sends that text. New copy in seven languages, drafts, in the ledger.
- **Trips are saved** (`20261010074045_…`): `book_trip`, `move_trip`, `cancel_trip` (each acts on the caller's own trips only), `my_trips()` (returns the place's name and real coordinates), and a trigger, `sync_trip_reminder`, that after a trip is saved, moved or cancelled queues, re-times or cancels its one `appointment_24h` text in `outbound_messages`. Consent is checked in the database: queued only when the member has a `notification_preferences` row with `sms_enabled` true and no STOP; re-checked on every change; never for a visit under a day away.
- **Appointments are written only through those functions** (`20261010074241_…`, a contract step): see "What was wrong".
- **The app reads one path.** `readAddedTrips()` now returns this tab's trips and the member's saved ones; `SavedTripsSync` (mounted in `Providers`, loaded lazily like `LocaleSync`) reads `my_trips()` once per sign-in, so Trips, the map, a place's page, Saved's visit tags and a conversation's visit card all show a saved trip with no change of their own. `useTrips()` is the one hook for new code (Trips uses it); `bookTrip` / `moveSavedOrLocalTrip` (`lib/savedTrips.ts`) save when it is a real place and a signed-in non-demo member, and keep the trip in the tab otherwise (example places, a program booking for a member).
- **Plan a trip** saves for real, says "We could not save that" and stays put if it cannot, and no longer says "Example trips only for now" for a trip that is saved.
- D-454, with Will's words. A worst-case reminder (34-character street, "12:30 PM", Trips link on both the vercel and joinpam.org domains) renders in all seven languages (new `trip-reminder.test.ts`).

## What was wrong, and what missed it

- **Anyone could write an appointment for anyone.** `appointments_provider` is `for all … with check (true)`, and on an INSERT only the check runs, so any signed-in person could insert an appointment for any member; and `appointments_own` let a member mark their own appointment `attended` (what the points award reads). Nothing used the table, so nothing noticed; the trip tests found it the day it became real, and with a reminder following each appointment it would also have texted the victim. Closed by revoking writes and leaving the policies select-only.
- **The consent check the dispatcher does has a hole**: `claim_outbound_messages` cancels for `sms_enabled = false` or STOP but not for a member with no preferences row (never asked). Not changed (Messages' to fix, Mira passed it to Nico); the queueing function does not queue for such a member.
- **My fixture was queued as someone else's.** A JWT claim set with `set_config(…, false)` outlives `reset role`, so a fixture written as the owner was treated as the last member's by a trigger. Tests now clear it first (same class as the program-lead test).
- **Fit audit**: the saved-trip card is a second card under the Trips drawer's fade, so the detector reports three `cut` entries; the same mechanism is already accepted for the example cards. Looked at in a 320px screenshot, accepted with the reason in `fit-known.json`.

## Decisions made

- D-454 — one day-before reminder, only for someone who turned reminders on; trips saved; appointments written only through functions.

## Verified

- `pnpm --filter @pam/db test`: passes with all migrations, including `28_saved_trips_and_reminders_test.sql` (consent on / never asked / off / STOP; under 24h; move re-times one text; move to under 24h cancels with the reason; cancel cancels; turned on later queues on the next change; nobody moves or cancels another member's trip; no direct write, no self-attended) and the whole earlier suite after the appointments policies changed.
- `numbering.test.ts` passes (the second migration carries its `-- contract:` line). web 61 tests (6 new: `savedTrips.test.ts`), config 822 (14 new: the reminder fits in all seven languages on both domains), `tsc` clean, `copy:status` in step, Storybook builds.
- In a browser (Chromium, 390px): Plan a visit to a real place → booked screen → Trips lists it; a saved trip shows on Trips; Change appointment saves the new time; no `[journey] no fixture` logs. Language fit on the saved-trips, program and trips stories at 320px in seven languages: no unaccepted defects.
- **Not run:** anything against the live project; the real dispatcher sending a queued trip text (nothing queues one until the migrations are applied and a member turns reminders on); the iPhone.

## Left undone

- **A program booking for a member (D-316) and example places stay in the tab.** The member's reminder for a visit a program books is a later step (it needs the program's own right to book, checked in the database).
- **The text links to `/trips/`** on whatever `app_settings.app_url` holds (still the vercel address from 0054). With joinpam.org as Pam's domain it needs updating before reminders mean anything; I did not touch it. A place's directions are one tap further.
- **Cancel has no screen.** `cancel_trip` exists and is tested; Trips has no cancel button yet.
- **Past trips** (attended, missed) come from `my_trips()` but the screens only show scheduled ones.
- **The claim's consent hole** (above), for Messages.
- **Wording**: "Taking longer than usual" after three days still implies a usual time; it goes with part 5b (the review wait read from the database).
- `join.staff.body` ("It takes a day or two") makes the same promise for a staff request; Accounts' wording, reported.

## Needs a human

- Will / Mira: apply the two migrations (074045 first; 074241 after it, its `drop policy` lines may need the SQL editor, D-387).
- Will: `app_settings.app_url` should be Pam's real address before the first reminder.
