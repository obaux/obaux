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

## 2. Everything else — reminders, notices — needs a dispatcher, and a signature

Appointment reminders and the "a place you saved is closed" notice queue in the
database and wait. Nothing sends them yet, and **nothing should** until two
things are true:

1. **A human has signed off the copy.** All fourteen templates carry an empty
   `reviewedBy`, and `renderSms` throws on an unreviewed one. That is a gate,
   not a gap — the review sheet is at
   https://claude.ai/code/artifact/f1dfb8d4-f64d-47c4-97d3-6a67f4c0eb09 and the
   copy is final; it needs a name against it.
2. **The dispatcher exists.** An Edge Function on a schedule that reads
   `outbound_messages` and `reminders`, renders each row from its template in
   the member's language, and honours:
   - quiet hours (§7.2, 21:00–07:00 by default, per member)
   - the STOP list — a member who replied STOP is never texted again
   - `assertSmsIsSafe` on the finished body, not the template
   - `name_may_disclose`, wherever a place is named

   It is not written yet. It is the last piece before PAM can text anybody.

## What is needed from a human

| Thing | Who | Blocks |
|---|---|---|
| Twilio account, number, Verify service | Will | Sign-in, so: everything |
| Those three values pasted into Supabase | Will | Same |
| A name against the SMS copy | Will | Reminders and notices |
| The dispatcher Edge Function | Next build session | Reminders and notices |

The first two are ten minutes and unblock the whole product. The last two can
follow.
