# D-453 — A STOP is stored, shown, and cannot be undone from the app; the Text alerts screen says what is not sent

**Date:** 2026-10-10 · **Branch:** `claude/messages-alert-texts`

Will, 10 October 2026, through Mira (the merge desk): "Let's review the promises and see if we
can build to keep some of those promises, but if we already have solutions in place that make
some of those things redundant, we can rewrite and clean up statements." Pam is "an app that
conveniently messages people to make it easy to help them access and get reminded about
services."

## What was found

1. **`notification_preferences` let a person clear their own STOP.** The policy is `for all` on
   their own row and the table was fully granted to `authenticated`, so a signed-in client could
   `UPDATE sms_stopped_at = null`, or delete the row and insert a fresh one. Reproduced against
   the migrations before the fix (the new test fails without it). The privacy page says "Nothing
   in the app can turn them back on". The dispatcher already honoured a stored STOP, so nothing
   was sent in the meantime; the promise was false at the API.
2. **Nothing records a STOP.** The column's comment says "set by the Twilio STOP webhook"; no
   such webhook exists in the repository. Twilio blocks sending to a number that replied STOP
   (its own opt-out handling), so the person is not texted, but Pam never learns it. Building the
   inbound webhook is a separate job and a question to Will (below), not done here.
3. **Almost no text on the alert screens is sent.** The only inserts into `outbound_messages` are
   the saved-place notice (0035–0037) and the staff-request approval and denial (0054–0056). The
   appointment reminders, the "did you make it" check, "someone wants to connect", and a message
   waiting, a visit booked, changed or planned, have templates (the last four are new drafts) and
   nothing that queues them. The Text alerts switches, the Text reminders list, `reminders.how`
   and the carrier samples all promised them.

## What was decided and built

- **The migration `20261010071947_a_stored_stop_cannot_be_cleared_from_the_app`** tightens the
  grants (not a contract change: it adds and removes no object): `authenticated` may read its own
  row and insert/update the *choices*, never `sms_stopped_at`, and may not delete the row. The
  service role keeps everything, so whatever records (or one day clears) a STOP still can. The
  account deletion cascade is the database's, not the person's grant, so it still removes the row.
- **The app shows a STOP** (`getTextStatus`): Text reminders and Text alerts say "Texts are off"
  and ask nothing; `setReminderConsent(true)` refuses for a stopped person; `getReminderConsent`
  answers false for one.
- **Text alerts: switches only for what is sent.** `LIVE` in `AlertsView.tsx` holds the kinds
  Pam really sends (today only a saved place closing); the rest are off, disabled and say
  "Coming soon. Pam does not send this text yet." A kind joins `LIVE` in the same change that
  queues and signs its text. The choice is the account's `sms_enabled`, not the phone's
  `localStorage`; "Saved." (`alerts.saved`) now shows after a save.
- **Four alert texts drafted** (`message_waiting`, `visit_booked`, `booking_changed`,
  `trip_planned`) in seven languages, unsigned. No name, place or day, so a lock screen reveals
  nothing. They are in `docs/sms-campaign-samples.md` (messages 14–17) so the carrier is filed
  once. The campaign description stays within the 1,024-character cap, at 1,021.
- **Wording that stops promising:** `reminders.how` drops "A few messages a week at most" (a
  promise Pam cannot keep and had no way to check); Text reminders adds a line on what is sent
  today (`reminders.today.member`/`.staff`); `join.waitingDone.yes` says what happens (the city
  and the answer are saved; Pam cannot text about it yet). `privacy.s.texts.p2` is left as it is:
  it is now true.

## What a later session might reverse

- The four alert texts being unsigned is deliberate: a text is the one thing Pam cannot show
  somebody for a second opinion, and the 9 October "approved to learn from" covers the drafts it
  was given on, not these.
- The unsigned templates sit in the dispatcher bundle on purpose (the dispatcher refuses them in
  every language). `sms.test.ts` lists them in `AWAITING_SIGNATURE`; signing one removes it from
  the list in the same commit.
- `hasTextAlerts()` is now always false (nothing is sent to staff yet; a member's answer needs the
  database). The program review screen's "Text me when it's live" row therefore always shows for a
  program lead and links to a screen of coming-soon switches: Places & programs' file, flagged.

## Not done

- **A receiver for STOP/START/HELP and for YES/NO replies** (an Edge Function Twilio calls,
  checking its signature). Without it a STOP is respected by Twilio but not recorded by Pam, so
  the screen says "Texts are off" only if something stored it. Will to decide.
- **A yes per kind of alert** (a column) for the day a second kind is built.
- **Queueing** the reminders, connection and alert texts.
- **The checkbox on the waiting-list screen** ("Text me when Pam opens in {city}") still asks for
  a text that cannot be sent; it is Accounts & invites' screen. Flagged.
