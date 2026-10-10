# D-460 — Twilio's STOP and START replies are recorded, and nothing else is answered

**Date:** 2026-10-10 · **Branch:** `claude/messages-sms-inbound`

Will, through Mira (10 October 2026): build the Twilio inbound receiver — STOP, START,
HELP, and later the YES/NO replies — "so a STOP is actually recorded", behind a switch that
is off by default, with a signature check; the merge desk deploys it and gives Will the one
address to paste into Twilio.

## What was built

- `supabase/functions/sms-inbound` (handler, signature, wiring) and two service-role-only
  database functions, `record_sms_stop` and `record_sms_start`
  (`20261010081342_…`, expand only), found by the verified phone number on the profile.
- A STOP sets `sms_stopped_at` (the first time is kept; somebody who never agreed gets a row
  with the stop and no yes). A START clears it and **nothing else**: `sms_enabled` stays what
  the person chose, so somebody who agreed, replied STOP and then START is texted again, and
  somebody who never agreed is not. Each leaves an `audit_log` row (`sms.stop`, `sms.start`)
  naming the profile and holding no number and no words.

## Choices a later session might question

1. **It records and does not reply.** The confirmation and HELP messages are Twilio's
   Advanced Opt-Out, already registered with the carrier (`sms-campaign-samples.md`). A reply
   from here too would send two texts for one. It answers an empty TwiML `<Response/>`.
2. **START clears the stop, not the yes.** Starting again is "yes, I am still here", not
   "yes, text me about everything". The person's earlier choice in the app stands.
3. **A START is a text reply, not the app.** `privacy.s.texts.p2` says "Nothing in the app can
   turn them back on". That stays true: the database still refuses the app clearing a stop
   (D-453); only this function, with the service key, after Twilio's signature, can. The
   sentence "reply START to a text from Pam" is not added to the screens until the function is
   on, because it would be false before.
4. **YES and NO are left alone.** "YES" is also Twilio's own opt-in word. Using it for "did you
   make it" means changing Twilio's opt-in keywords first, and the check-in is not queued by
   anything yet. The words STOP uses are Twilio's list (STOP, STOPALL, UNSUBSCRIBE, CANCEL,
   END, QUIT), and only as the whole message — "please stop" is a person writing, not the
   keyword. Twilio's own `OptOutType`, when it sends one, is trusted over the words.
5. **Only Twilio.** A request whose `X-Twilio-Signature` does not match the account's auth
   token and the exact address (`SMS_INBOUND_URL`) is refused with a 403 before anything is
   read or written; without the token or the address configured it will not run (503). The
   signature code is checked against Twilio's documented example and against an independent
   implementation. The function is deployed without JWT verification, as it must be.
6. **Numbers nobody has are ignored.** Somebody who texted STOP and never joined has nothing in
   Pam to change, and Twilio has blocked them anyway. A denied staff request's phone-only text
   keeps skipping the STOP check by Will's earlier instruction (0055); Twilio is the stop there.
7. **Nothing is logged but the kind.** Not a number, not a word of the reply.

## Not done

- The YES/NO replies, and the sentence about START on the screens.
- Whether Twilio forwards STOP messages to the webhook under Advanced Opt-Out on this account
  is Twilio's behaviour and could not be tried from here: step 5 of `docs/sms-setup.md` is the
  test, with Will's own phone, before anyone relies on it.
