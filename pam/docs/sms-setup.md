# Turning on text messages

PAM cannot do anything without this. Sign-in is a code by text; there is no
password. Until an SMS provider is configured, the admin account exists, the
sign-in screen exists, and **nobody can complete a sign-in**.

Two separate things use SMS, and they are set up in different places.

## 1. Sign-in codes — configured in Supabase, not in our code

Supabase sends the six-digit sign-in code itself, through a provider you connect
in its dashboard. PAM's own templates are not involved.

1. **Twilio**: create an account, buy a US number with SMS, and create a
   **Verify Service** (Console → Verify → Services). Note the Account SID, the
   Auth Token, and the Verify Service SID.
2. **Supabase** → Authentication → Providers → **Phone**: enable it, choose
   Twilio Verify, and paste those three values.
3. Authentication → **URL Configuration**: add the app's URL once it is
   deployed, so sign-in redirects are accepted.

That is the whole of it. Sign-in starts working the moment it is saved, and
`/signin` needs no change.

**Cost:** a Verify check is a few cents. Set a spending alert in Twilio rather
than trusting a pilot to stay small.

## 2. Everything else — reminders, notices — is built and running

Appointment reminders and the "a place you saved is closed" notice go into a
queue in the database. A small program — the dispatcher — wakes up **every five
minutes**, asks the queue what is due, writes the message in the member's
language and hands it to Twilio.

That program is now written, live, and running on its five-minute clock. It sent
nothing, and will keep sending nothing, for one reason: **no human has signed
off the copy yet.**

### The signature is the switch

All thirteen message templates carry an empty `reviewedBy`. The dispatcher
refuses any template without a name against it, writes the refusal onto the
queued message so it shows up rather than vanishing, and moves on. Proved on the
live project on 12 September 2026: a queued notice came back
`claimed 1, sent 0 — copy is not signed off`.

The review sheet is at
https://claude.ai/code/artifact/f1dfb8d4-f64d-47c4-97d3-6a67f4c0eb09. The copy
is final; it needs your name against it. Nothing about the plumbing changes when
you sign — the same clock starts delivering.

### What the database decides, and what the dispatcher decides

The rules that say **whether** a message may go out live in the database, where
they cannot be redeployed away:

- **Quiet hours** — 21:00 to 07:00 Philadelphia time by default, adjustable per
  person. A message due inside them waits for the morning rather than being
  dropped.
- **Someone who replied STOP**, or who turned texts off, is taken out of the
  queue permanently, with the reason recorded.
- **Somebody with no phone number** is recorded as a failure so it is visible,
  not retried forever.
- **Claiming is atomic** — two runs overlapping can never both send the same
  reminder. A doubled "your visit is tomorrow" is how somebody decides to turn
  texts off.

The dispatcher decides only **how a message is worded**, and checks the finished
words one last time before they leave: PAM must identify itself, 160 characters
maximum, no emoji, and nothing that reveals justice involvement. A message that
fails goes back onto the queue as failed, with the reason — and the reason never
repeats the offending word, because a log line quoting it is the same disclosure
in a different place.

### Turning it on for real

Once the copy is signed, three values go into Supabase → Edge Functions →
dispatch-sms → Secrets:

| Name | What it is |
|---|---|
| `TWILIO_ACCOUNT_SID` | From the Twilio console |
| `TWILIO_AUTH_TOKEN` | From the Twilio console |
| `TWILIO_MESSAGING_SERVICE_SID` *or* `TWILIO_FROM_NUMBER` | The service or the number messages come from |

Until those exist the dispatcher records "Twilio is not configured" against each
message instead of sending it — so the order you do this in cannot surprise
anybody.

To stop the clock at any time, from the SQL editor:

```sql
select cron.unschedule('dispatch-sms');
```

## What is needed from a human

| Thing | Who | Blocks |
|---|---|---|
| Twilio account, number, Verify service | Will | Sign-in, so: everything |
| Those three values pasted into Supabase → Authentication → Providers → Phone | Will | Same |
| A name against the SMS copy | Will | Reminders and notices |
| Twilio credentials into the dispatcher's secrets | Will | Reminders and notices |

The first two are ten minutes and unblock the whole product. The last two can
follow.

### Checked on 12 September 2026

Sign-in is still not possible. Asking the live project for a sign-in code
answers `Unsupported phone provider` — Twilio is paid for and working on your
side, but **Supabase has not been pointed at it yet**. That is the single
setting in step 1 above, and it is the one thing standing between the app and
its first real user. No text was sent by that check and nothing was charged.
