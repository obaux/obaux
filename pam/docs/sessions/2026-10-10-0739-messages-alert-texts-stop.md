# 2026-10-10 — Messages & notifications (Nico): the alert texts, STOP, and promises Pam did not keep

**Branch:** `claude/messages-alert-texts` · **Lane:** Messages & notifications

Job from Will through Mira (10 October): "Let's review the promises and see if we can build to
keep some of those promises, but if we already have solutions in place that make some of those
things redundant, we can rewrite and clean up statements." Pam is "an app that conveniently
messages people to make it easy to help them access and get reminded about services."

## What changed

- **Four alert texts drafted** (`message_waiting`, `visit_booked`, `booking_changed`,
  `trip_planned`) in seven languages, unsigned, so none can send. Tests list them
  (`AWAITING_SIGNATURE` in `sms.test.ts` and `dispatcher.test.ts`).
- **Text alerts** offers a switch only for what is sent (a saved place closing, `LIVE`); the
  rest say "Coming soon". The choice is the account's, not the phone's; "Saved." shows.
- **STOP:** migration `20261010071947_…` stops the app (the database, really) clearing
  `sms_stopped_at`; Text reminders and Text alerts say "Texts are off" for a stopped person.
- **Consent in the claim:** migration `20261010072848_…` — `claim_outbound_messages` cancels a
  reminder or a notice queued for a member who never agreed ("never agreed to texts").
- **Wording:** `reminders.how` (no more "a few a week"), `reminders.today.*`,
  `join.waitingDone.yes`, the booked/changed lines, and the consent list loses "someone wants to
  connect" (nothing sends it). Samples file: nine real or planned texts, the new domain's URLs,
  description 981 of 1,024.

## What was wrong, and what missed it

- A signed-in person could clear their own STOP at the API: `for all` RLS plus a table-wide
  grant. Every check passed because the tests attacked reading other people's rows, never a
  person's own protected column. The new test (26) does, and fails without the migration.
- The claim texted anyone with **no preferences row**: the two cancel rules only matched a row
  that said no. Found by Piper's finding; test 27 covers never asked, opted in, STOP and no.
- The campaign samples and the consent screen listed texts nothing queues: only a saved place
  closing, and the staff request decision, are queued. Reminders have a template and a `reminders`
  table but no writer. Nothing missed it because the templates are tested for length and safety,
  not for being used.
- Nothing records a STOP (the column's comment cites a Twilio webhook that does not exist).

## Decisions made

- D-453 (this job). Left for later, in it: the receiver for STOP/START/HELP and YES/NO.

## Verified

- Config tests 920 pass (twice: the bundle regenerates on the first run), `tsc` clean in web and config.
- Database suite passes with tests 26 and 27; each fails without its migration.
- Storybook builds; fit audit on the alert, reminder and texts-stopped stories: clean.
- e2e: consent, join and back specs, all three viewport projects: 114 pass.
- Not run: the full fit audit, the full Playwright suite, or anything against the live database.

## Left undone

- Queueing the reminder, connection and alert texts; nobody signed the four drafts.
- The receiver for replies. A yes per kind of alert (a column).
- The waiting-list checkbox ("Text me when Pam opens") and the program review "Text me when it's
  live" row still ask for texts that cannot be sent (Accounts' and Places' files).
- Staff's "What we would send" list still names texts nothing sends.

## Needs a human

- Will: sign the four texts; whether to build the reply receiver; the carrier filing.
