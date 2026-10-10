# Turning on text messages

## Go-live runbook: the day-before reminder (D-473)

Pam's north star is the text that reminds a person the day before a visit. This is the
order for the day Will finishes the Twilio filing and says go. It is tested: the database
half is `packages/db/test/36_day_before_reminder_rehearsal_test.sql`, and the dispatcher
half (the words in seven languages, the length limit, the call to Twilio, with Twilio
faked) is `packages/config/test/dispatch-sms.test.ts`. Detail for each step is in the
sections below; this page is only the order, who does it, and how to stop.

**What a member gets.** One text, 24 hours before a planned visit, to a member who
ticked "Text reminders" and has not replied STOP, in their language, after 7 am and
before 9 pm Philadelphia time (their quiet hours). It carries the time, the street
(up to 34 characters) and a link to Trips. It does not carry the name of a program
service the member picked. Nothing else queues a text to a member yet: the 2-hour and
morning-of reminders, the check-in and "connect" texts are signed but nothing creates them.

### Before the day (merge desk)

1. `main` is what is deployed: run the three suites on `main` (`pnpm --filter @pam/db test`,
   `pnpm --filter @pam/config test` twice, `pnpm --filter @pam/web build`).
2. Redeploy `dispatch-sms` from `main` (§3 step 2). The deployed one still says "PAM:", in two
   languages. Read its log after the next tick: `{claimed, sent, failures}` with nothing in
   `failures`.
3. Confirm the secret **names** are set on the project: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
   and `TWILIO_MESSAGING_SERVICE_SID` or `TWILIO_FROM_NUMBER`. Do not set `DISPATCH_SECRET`
   (§3: the clock sends none).
4. Confirm the clock is on: `select jobname, schedule, active from cron.job where jobname = 'dispatch-sms';`
   (every five minutes, `active` true).
5. Check the app's address: `select value from app_settings where key = 'app_url';`. The link in
   the text is that plus `/trips/`. **Keep the address to 46 characters or fewer, with no trailing
   slash.** Longer, and a Russian or Arabic reminder no longer fits its two segments, so it is
   sent in English instead. (Russian has 11 characters to spare today; Arabic 12; the Latin
   languages 18; Chinese 28 to 30.)
6. Nothing queued by mistake: `select count(*) from outbound_messages where status = 'scheduled' and template_key = 'appointment_24h';` is only real members' trips.

### The day

| # | Who | Step |
|---|---|---|
| 1 | Will | Finish the Twilio filing; the campaign shows **approved** and the Pam number is in the messaging service. Tell the merge desk "go". |
| 2 | Merge desk | Do §3's checklist through step 7, so a STOP reply works before the first reminder goes out. STOP working matters more than the reminder. |
| 3 | Will | On his own phone, in Pam: Profile → Text reminders → turn on. Check his language is the one he wants. |
| 4 | Will | Plan a test visit that starts **exactly one day and ten minutes from now**, at a time between 7:00 am and 9:00 pm. Its reminder is then due ten minutes from now. |
| 5 | Will | Within about fifteen minutes his phone gets one text starting "Pam:" with the time, the street and a link. Open the link: it lands on Trips. |
| 6 | Merge desk | Confirm (below). Then cancel the test visit in the app: its reminder, if still waiting, is cancelled with it. |
| 7 | Merge desk | Merge `claude/messages-reply-start` (§3 step 8). That is all that opens it: members who tick the box get reminders; nobody else does. |

### Checking the first real reminder

```sql
select o.status, o.template_key, o.send_at, o.sent_at, o.failure_reason, o.locale
from outbound_messages o
where o.template_key = 'appointment_24h'
order by o.created_at desc limit 10;
```

**Fine** is `status = 'sent'`, a `sent_at` within five minutes of `send_at` (the clock ticks every five
minutes) and no `failure_reason`. Then Twilio's own message log (Console → Monitor → Logs →
Messages) shows it **delivered**. And the function's log shows `sent: 1, failures: []`.

- `scheduled` after its time: the member is in quiet hours, or the clock is off. Check `cron.job`.
- `cancelled`, `member stopped texts` or `never agreed to texts`: working as intended.
- `failed`: `failure_reason` says why. `Twilio 4xx` is Twilio refusing (the filing, a wrong
  sender, a number it will not text); the row is not retried, so fix the cause and plan the visit again.
- `sent` here but Twilio shows nothing: the secrets point at a different account.

Every day for the first week: `select status, count(*) from outbound_messages where template_key = 'appointment_24h' and created_at > now() - interval '2 days' group by 1;` and any `failed` read in full.

### Switch it off at once

Pick the smallest that fits. None needs a deploy.

1. **Stop every text now** (merge desk): `select cron.alter_job((select jobid from cron.job where jobname = 'dispatch-sms'), active := false);`
   Nothing is sent, nothing is lost: every message stays waiting. Turn it back on with `active := true`.
   **Read this before turning it back on:** a reminder that was waiting is sent as soon as the clock
   returns, even if its visit has passed (known gap 4 below). After a pause longer than a few hours,
   first cancel the overdue ones (step 2).
2. **Drop the waiting reminders** (merge desk): `update outbound_messages set status = 'cancelled', failure_reason = 'pulled by hand' where template_key = 'appointment_24h' and status = 'scheduled';`
   (Sign-in codes are Supabase's and are not affected by either step.)
3. **One person**: they reply STOP, or turn "Text reminders" off in the app. Either is honoured on the next tick.
4. **Do not** remove the Twilio secrets to stop sending: the dispatcher marks each waiting message *failed*, and a failed message is not retried.

### What the rehearsal found (reported to the merge desk, 10 October)

Pinned in the database test as "KNOWN GAP", passing on today's behaviour so that fixing one turns its line red:

1. **An evening visit is reminded on its own day.** A visit at 9 pm or later has its reminder due at
   9 pm the day before, inside quiet hours, so it is held to 7 am — the morning of the visit — and
   still says "tomorrow".
2. **Texts turned on after a trip was planned.** A trip planned before the member said yes gets no
   reminder when they do. Only a new or changed trip queues one.
3. **A long place name is cut mid-word** by the trigger at 34 characters ("…Opportunitie") before the
   renderer, which would cut at a word, sees it.
4. **A late reminder is not dropped.** Nothing stops a reminder that went overdue (a pause, an outage)
   from going out after the visit has started.

Cancel and move work today: cancelling a trip cancels its reminder, moving it re-times it, and moving
it to less than a day away cancels it.


Pam cannot do anything without this. Sign-in is a code by text; there is no
password. Until an SMS provider is configured, the admin account exists, the
sign-in screen exists, and **nobody can complete a sign-in**.

Two separate things use SMS, and they are set up in different places.

## 1. Sign-in codes — configured in Supabase, not in our code

Supabase sends the six-digit sign-in code itself, through a provider you connect
in its dashboard. Pam's own templates are not involved.

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
words one last time before they leave: Pam must identify itself, 160 characters
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

Two ways forward, and Pam needs both eventually:

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
campaign describes what Pam actually sends, and takes a few days. It asks for:

- **Use case.** Pam sends sign-in codes and appointment reminders — "Mixed" or
  "Low Volume Mixed" covers both. Not marketing, which is held to a higher bar.
- **Sample messages.** Paste the real ones from the review sheet, placeholders
  and all. Invented samples that do not match what goes out are a rejection.
- **How people opt in.** This is the part carriers actually scrutinise, and the
  part that is about Pam's screens rather than paperwork: a member is invited by
  their case manager, types their own number into the sign-in screen, and that
  screen has to say, in plain words, that Pam will text them and how to stop.
  Expect to supply a screenshot of it.
- The phone number the messages come from — the one already bought. Numbers can
  be added to or removed from a campaign afterwards, so swapping the sending
  number later does not mean registering again.

Cost is a few dollars one-off for the brand and roughly a dollar fifty a month
for the campaign, plus the per-message price.

**The opt-in wording on the sign-in screen is Pam's job, not paperwork.** It is
now on the screen, at the foot of it below the help link: *"Pam will text you a
code to sign in. Later, we may text you reminders and updates about your
account. Reply STOP to stop texts. Reply HELP for help. Text and data rates may
apply."* — in both languages, and held there by a browser test, because removing
it would quietly cost the pilot its ability to text anybody.

The wording is deliberately role-neutral. One sign-in screen serves members,
program managers, case managers and super admins, so it promises "reminders and
updates about your account" rather than naming appointments, which only a member
would get. The test asserts it is on screen without scrolling rather than
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

## 3. Replies — STOP and START, the release checklist (D-460)

Twilio already stops texting a number that replied STOP, and its Advanced Opt-Out
answers STOP and HELP itself. What Pam never did was **learn** it, so the app
could not say "Texts are off" and a START could not bring texts back. The
`sms-inbound` function is the address Twilio tells when somebody replies; it
records a STOP or a START against the person with that number and answers with
nothing (so nobody gets two replies). It is off until switched on.

This is one release: the database half, the dispatcher, the receiver, Will's
Twilio step, and the one sentence on the screens. Work down it in order. Written
and checked against the live project on 10 October 2026 (09:40 UTC).

### What was true when this was written

- **Live database:** the three migrations are applied — `…a_stored_stop_cannot_be_cleared_from_the_app`,
  `…reminders_go_only_to_people_who_agreed_to_texts` and
  `…a_stop_or_start_reply_is_recorded_by_the_number` (`list_migrations`). Nothing
  to apply.
- **Live functions:** only `dispatch-sms` (version 15, last deployed 17 September)
  and `link-preview`. `sms-inbound`, `send-invite-emails` and `translate-messages`
  are not deployed.
- **`dispatch-sms` is old.** The deployed one still carries the 13 September
  templates in English and Spanish only, with "PAM:" at the front, fifteen
  templates, none of the seven-language logic, and none of the four alert texts.
  `main` has the "Pam:" wording, all seven languages, the two-segment reminders,
  "a text always goes out", nineteen templates (the four alert texts signed by Will
  on 10 October). The code around the templates differs in the language it picks
  and in what it logs when a text falls back to English; the schedule, the way it
  claims, the way it sends and the secrets it reads are the same. The database
  already refuses to hand it a text for somebody who never agreed, or who replied
  STOP (`claim_outbound_messages`), whichever version is running.
- **The clock** (`cron` job `dispatch-sms`, every five minutes) calls the function
  with the project's publishable key and **no** `x-dispatch-secret` header. So do
  not set `DISPATCH_SECRET` on `dispatch-sms` without changing that call first, or
  every run is refused with a 401.

### The checklist

1. **Look first.** `list_migrations`: the three above are there. `list_edge_functions`:
   `dispatch-sms` is version 15. `select jobname, schedule, command from cron.job`:
   the `dispatch-sms` job is as in `0040` (every five minutes, the publishable key,
   no `x-dispatch-secret`). Whether `DISPATCH_SECRET` is set on the function cannot
   be read from here, but the answers show it: `select status_code, content from
   net._http_response order by created desc limit 6`. **Fine looks like** a 200 with
   `{"claimed":0,"sent":0,"failures":[]}` (nothing is queued). **A 401 is the secret
   trap**: the secret is set and the clock is being refused, so nothing has sent
   since it was set; say so, and fix the clock's call first. (Checked by the merge
   desk on 10 October: 72 responses in six hours, all 200; `outbound_messages` holds
   one row ever, a denied staff request sent on 17 September.) Run `pnpm --filter @pam/config test` on `main` and
   check `git status` is clean (the first run regenerates
   `supabase/functions/dispatch-sms/templates.json`; a diff after it means a stale
   bundle, so stop).
2. **Redeploy `dispatch-sms` from `main`**, with JWT checking left as it is
   (`supabase functions deploy dispatch-sms`; the clock sends the publishable key as
   its login). Secrets stay as they are:
   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID` or
   `TWILIO_FROM_NUMBER`. Wait for the next five-minute tick and read the function's
   log: the answer is `{ claimed, sent, failures }` and nothing in `failures` says
   "not signed off". (A text that falls back to English logs
   `sent in English: <template> (<language>): <why>` and never the words.)
3. **Deploy `sms-inbound`**: `supabase functions deploy sms-inbound --no-verify-jwt`
   (no JWT, because Twilio sends no Supabase login; the signature is the check).
   Leave it **off**.
4. **Set its secrets** (names only; none is ever in the repo or a chat):
   - `SMS_INBOUND_URL` — exactly `https://shobqzuhicoiymtumiaz.supabase.co/functions/v1/sms-inbound`
     (the signature covers the address, so nothing added or removed: no trailing
     slash, no query);
   - `TWILIO_AUTH_TOKEN` — the dispatcher's own, already set; Supabase function
     secrets are shared by every function in the project, so there is nothing to
     add. Confirm it is there.
5. **Try it signed out, before Twilio is pointed at it.** Set `SMS_INBOUND=on`,
   then, from a terminal:
   `curl -i -X POST "$SMS_INBOUND_URL" -d 'From=%2B15555550100' -d 'Body=STOP'`
   Expect **403 "not Twilio"**, and nothing written. A 200 here means the switch is
   off; a 503 means the token or the address is missing; a 500 is a bug, so switch
   `SMS_INBOUND` off again and tell Nico.
6. **Will's Twilio step.** Console → Messaging → Services → the Pam service →
   **Integration** → *Incoming messages* → "Send a webhook", method **POST**, request
   URL = the address in step 4. Leave **Advanced Opt-Out** on with its default
   keywords and the confirmation and HELP messages the campaign registered
   (`docs/sms-campaign-samples.md`). Save.
7. **Will's test, from his own phone** (the number on his Pam profile; it must be
   the number he signs in with, because that is how the reply is matched):
   1. Text **STOP** to Pam's number. Twilio answers with its own confirmation.
   2. Within a few seconds his **Text reminders** screen (Profile → Text reminders)
      says **"Texts are off"** and asks nothing. The merge desk can see it too:
      `select action, target_type, created_at from audit_log where action in ('sms.stop','sms.start') order by created_at desc limit 5;`
      — one `sms.stop` row naming his profile, and no number and no words.
   3. Text **START**. Twilio confirms; the screen is back to its question, and there
      is one `sms.start` row.
   4. If step 2 shows nothing: the likely cause is that Twilio does not forward
      opt-out keywords to the webhook on this account. Say so; do not guess. Texts
      are still stopped at Twilio, so nobody is harmed while it is looked at.
8. **Merge `claude/messages-reply-start` last**, once step 7 has worked. It adds one
   sentence under "Texts are off" on Text reminders and Text alerts — "To get texts
   again, reply START to a text from Pam." — in all seven languages. It is true only
   when steps 2–7 are done, which is why it goes after them. (It is strings only: a
   new Vercel build, nothing in the database.)
9. **Tell Nico "done"** and he updates STATUS and `before-launch.md`.

### Turning it back off

- `SMS_INBOUND` back to anything but `on` (or removing the secret): the function
  answers an empty reply and touches nothing. Twilio keeps stopping texts to a number
  that replied STOP either way.
- Removing the webhook in Twilio: nothing reaches the function.
- Nothing in the database needs undoing: a stored STOP is only ever cleared by a
  START or by the service role, never by the app (D-453).

### What it does **not** do yet

Answer YES or NO to "did you make it". "YES" is also Twilio's own opt-in keyword, so
that job starts with changing the opt-in keywords in Twilio; nothing sends the
check-in yet anyway.
