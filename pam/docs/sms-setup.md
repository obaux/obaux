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

### Twilio has to be out of trial before it will text a real member

Error **21608** — *"to send messages or make calls to unverified numbers, you
must have an approved Primary Compliance Profile"* — means the Twilio account is
still in trial mode. A trial account will only text numbers you have personally
verified in the console, which is fine for testing and useless for a pilot: a
member cannot verify themselves into somebody else's Twilio account.

Two ways forward, and PAM needs both eventually:

1. **Now, for testing:** Twilio console → Phone Numbers → Verified Caller IDs →
   add your own number. Sign-in starts working for you within a minute.
2. **Before any real member:** complete the Primary Compliance Profile in the
   Twilio console (business details, a contact person), and register the number
   for A2P 10DLC — US carriers require it for application-sent texts. Approval is
   not instant, so start it well before the pilot, not the week of.

Until step 2 is approved, sign-in works only for numbers on the verified list.
That is a hard limit on how many people can be in the pilot, and it is worth
knowing before inviting anybody.

### Registering as a business, step by step

Two registrations, done in order, both in the Twilio console. Neither is instant,
and the second is reviewed by the phone carriers rather than by Twilio.

**First: the Primary Customer Profile** (Trust Hub → Customer Profiles). This is
who Oba Design is. Have ready:

- The legal business name **exactly as it appears on the IRS EIN letter** — a
  mismatch here is the single most common rejection, including "LLC" vs "L.L.C."
- The EIN itself. If Oba Design does not have one, it is free and takes about
  fifteen minutes at irs.gov; registering as a sole proprietor instead is
  possible but carriers cap how much it may send, which a caseload of reminders
  will hit.
- Business type (LLC, corporation, sole proprietorship), registered address, and
  the website.
- A contact person: name, job title, email and phone. Use the business email. The
  phone here is who Twilio calls about the account — it is not the number
  messages come from, and it can be changed later.

**Then: the A2P brand and campaign** (Messaging → Regulatory Compliance → A2P
10DLC). The brand is the business, and is usually approved within hours. The
campaign describes what PAM actually sends, and takes a few days. It asks for:

- **Use case.** PAM sends sign-in codes and appointment reminders — "Mixed" or
  "Low Volume Mixed" covers both. Not marketing, which is held to a higher bar.
- **Sample messages.** Paste the real ones from the review sheet, placeholders
  and all. Invented samples that do not match what goes out are a rejection.
- **How people opt in.** This is the part carriers actually scrutinise, and the
  part that is about PAM's screens rather than paperwork: a member is invited by
  their case manager, types their own number into the sign-in screen, and that
  screen has to say, in plain words, that PAM will text them and how to stop.
  Expect to supply a screenshot of it.
- The phone number the messages come from — the one already bought. Numbers can
  be added to or removed from a campaign afterwards, so swapping the sending
  number later does not mean registering again.

Cost is a few dollars one-off for the brand and roughly a dollar fifty a month
for the campaign, plus the per-message price.

**The opt-in wording on the sign-in screen is PAM's job, not paperwork.** It is
now on the screen, at the foot of it below the help link: *"PAM will text you. A code now,
and reminders for visits you plan. Reply STOP any time to stop. Reply HELP for
help. Text and data rates may apply."* — in both languages, and held there by a
browser test, because removing it would quietly cost the pilot its ability to
text anybody. The test asserts it is on screen without scrolling rather than
where it sits, so the layout can change without breaking the requirement.

The sample messages to paste into the campaign are in
`docs/sms-campaign-samples.md`, generated from the same file the dispatcher
sends from.

### If sign-in answers "Database error finding user"

Seen on 12 September, on the very first real sign-in attempt. It is not the
phone provider and not the code: an account created through the admin API can
end up with empty-but-NULL columns that the auth service reads as text, and it
fails looking the person up before it ever reaches Twilio. One-off repair, safe
to re-run:

```sql
update auth.users set
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change               = coalesce(email_change, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, ''),
  reauthentication_token     = coalesce(reauthentication_token, '');
```

Worth re-running after seeding any new admin, until we confirm it has stopped
happening.

### Checked on 12 September 2026

Sign-in is still not possible. Asking the live project for a sign-in code
answers `Unsupported phone provider` — Twilio is paid for and working on your
side, but **Supabase has not been pointed at it yet**. That is the single
setting in step 1 above, and it is the one thing standing between the app and
its first real user. No text was sent by that check and nothing was charged.
