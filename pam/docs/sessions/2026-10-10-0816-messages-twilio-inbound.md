# 2026-10-10 — Messages & notifications (Nico): the Twilio receiver, so a STOP is recorded

**Branch:** `claude/messages-sms-inbound` · **Lane:** Messages & notifications

Job from Will through Mira (10 October): build the Twilio inbound receiver (STOP, START,
HELP, YES/NO later), signature-checked, behind an off-by-default switch; she deploys it.

## What changed

- `supabase/functions/sms-inbound` (not deployed, off unless `SMS_INBOUND=on`): verifies
  `X-Twilio-Signature`, reads STOP/START, records them, answers an empty TwiML reply.
- Migration `20261010081342_a_stop_or_start_reply_is_recorded_by_the_number.sql` (expand only,
  not applied): `record_sms_stop`, `record_sms_start`, service role only, audit rows without
  numbers.
- `docs/sms-setup.md` section 3 (what the merge desk and Will do), D-460.

## What was wrong, and what missed it

- Nothing recorded a STOP, though `sms_stopped_at` was documented as "set by the Twilio STOP
  webhook". Found while doing D-453; every check passed because the tests set the column by
  hand and the screens only read it.
- My first signature test used the wrong example numbers from memory and failed; an independent
  Python HMAC of the same input agreed with Twilio's documented value, so the code was right and
  the test was wrong.
- First database test run collided with the unique phone constraint (the seed's numbers).

## Decisions made

- D-460.

## Verified

- Config tests 959 pass; `tsc` clean in config. Database suite all pass with
  `29_sms_stop_and_start_test.sql` (it fails if the functions are missing or callable by a client).
- Signature checked against Twilio's documented example and an independent implementation.
- Not verified: anything against Twilio. No webhook is configured; whether Advanced Opt-Out
  forwards STOP messages here is Twilio's behaviour (`docs/sms-setup.md` step 5 is the test).

## Left undone

- YES/NO replies (need Twilio's opt-in keywords changed first; nothing sends the check-in yet).
- The sentence "reply START to get texts again" on Text reminders and Text alerts: add it when
  the function is switched on.
- Staff's "What we would send" list; the mail-service privacy line for Lena.

## Needs a human

- Will: paste the function's address into Twilio, and reply STOP from his own phone to try it.
