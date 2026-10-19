# STOP, START and the number that stopped: a Privacy read

**Written by:** Lena (Languages & legal), 19 October 2026, for Mira, Nico, Sage and then Will. **Asked:** Mira, 19 October, 01:00, two reads from Nico that gate texts going live.
**Read:** `claude/messages-stop-needs-start` @ `7b980bc6` (migration `20261019005247`, the app's `useReminderConsent.ts` and the Reminders page), the live `phone_stops` and `support_texts_log` tables (migration `20261011042645`, live as `20261011093720`), `sms-inbound`, every English line about texts, the support site and the SMS filing text.
**Not read:** Nico's draft of the keyed hash for a number with no account. It is not on any branch yet, so section 2 is written from Mira's description (HMAC with a Vault key; no readable number, no message, no count) and lists what the line depends on.
**Nothing is signed, translated or switched on.** No English line changes in this note; the lines in section 2 are for Sage to rewrite.

## The short version

1. **No line in Privacy, Terms or a consent screen says "you can turn texts back on any time."** The lines that speak about it say the opposite and stay true: *"Nothing in the app can turn them back on"* (`privacy.s.texts.p2`, `reminders.stopped.body`). The new trigger makes them more true, not less. Terms has no line about texts being switched on or off. The app adds no new words: a yes it cannot save goes through the existing failure alert (`reminders.agree`).
2. **Two places do tell a person the way back, and they are the ones to fix when START works:** the support post *Texts from Pam* ("If you replied STOP by mistake, contact Pam", and "…you need to contact Pam" under *A text did not come*), and the opt-out message filed with the carriers ("Reply START to get them again"). The post should say *text START*, and the filed message should stay as it is. **Neither is true until `sms-inbound` is deployed** (`SMS_INBOUND=on`, Twilio pointed at it), because until then Twilio answers START by itself (Advanced Opt-Out) and Pam never hears it, so Pam's own stop stays. Today nobody at Pam can clear a stop either: `record_sms_start` is service-role only and no screen calls it.
3. **The stopped-number record needs a Privacy line, and it already needed one.** `phone_stops` (a plain SHA-256 of the number of someone who texted STOP and has no account) has been live since 11 October (D-524). **No Privacy line names it, and `support_texts_log` (a hash of each number a super admin texted, who sent, the outcome) is not named either.** Both are empty in practice today because `sms-inbound` is off and answering by text is off (D-547). Nico's draft changes the key and the purpose (so a person who joins later is not texted), which makes the record matter more, not less.
4. **The line goes with the switch, not before.** The first stranger's STOP writes the record, and that is when `sms-inbound` turns on. Will signs before that day; `legal:date privacy` the same day.

## 1. The check against the pages

| Where | Line | Still true after `7b980bc6`? |
|---|---|---|
| Privacy, Text messages `texts.p2` | Reply STOP any time and the texts stop. Nothing in the app can turn them back on. | Yes. The database now refuses a yes on a stopped row, so it is true of the database as well as the app. No START words yet: they would be false until `sms-inbound` is live. |
| Privacy, Your choices `your-choices.p1` | Stop the texts by replying STOP. | Yes. |
| Privacy, Delete `privacy.delete.stop` | If you only want the texts to stop, reply STOP to any text from Pam. | Yes. |
| Terms | nothing about texts being turned on or off (`terms.s.your-account.p3` is about a new number) | Nothing to change. |
| Reminders screen `reminders.how` (the Text alerts screen carries no how-line now) | Pam sends one text each time something on this list happens. Reply STOP to stop, or HELP for help. Text and data rates may apply. | Yes. |
| Reminders screen after a STOP `reminders.stopped.title/body` | Texts are off. You replied STOP, so Pam does not text you. Nothing in the app can turn texts back on. | Yes. It shows no way back. Adding "text START" waits for `sms-inbound`. |
| A yes the app cannot save because it cannot read the stop | the failure alert, `malfunction.show('reminders.agree', …)` | No new words. The name `reminders.agree` is already in the closed list of action names. |
| Support post *Texts from Pam* (`apps/site/src/content/TextsFromPam.tsx`, the rules step, and *A text did not come* step 2) | "If you replied STOP by mistake, contact Pam." and "…you need to contact Pam." | Not wrong today (no START path) but sends people to someone who cannot clear a stop. Needs "text START" once START works; until then the post should say who clears it by hand, or nothing. |
| `docs/sms-campaign-samples.md` Opt-out message (set in Twilio's Advanced Opt-Out) | You will not get any more texts from Pam. Reply START to get them again. | True only with `sms-inbound` on. After START the texts come back for the switches the person had on before the STOP; a yes the app refused during the stop must be given again. |

The other languages carry the same sentences and need no change while the English does not.

## 2. The number with no account

**What Pam keeps now (live, D-524):** `phone_stops(phone_hash, stopped_at)`. `phone_hash` is an unsalted SHA-256 of the E.164 number, so anyone who can read the table can test every number in a country in minutes. D-524 says so itself: it keeps the number "out of casual view, not out of reach." Service role only (RLS forced, no grants). START deletes the row. `phone_is_stopped` is read only by the support-text path.

**What Nico's draft is described as changing:** the hash becomes a keyed HMAC with the key in Vault (so the table alone cannot be used to test numbers), and the stop is used for a second purpose: a person who joins later with that number is not texted. That is a new use of a record about someone with no account.

**The Privacy line that is needed.** One new line, in *Text messages* (`privacy.s.texts`, as `p4`) so a person who is looking for what STOP does finds it there. It has to say:
- who it is about: someone who replied STOP and has no Pam account;
- what Pam keeps: **a scrambled code of the number, not the number** (the p12 calendar line already uses "scrambled copy" for the same property), and whether the time of the STOP is kept (see below);
- why: so Pam does not text them if they join later;
- who can read it: no one reads a number from it; only Pam's system uses it (service role, key held apart from the table);
- how long, and how it ends: until they text START, and what happens to it when they join.

A candidate for Sage to rewrite (not signed):

> If you reply STOP to a text from Pam and you do not have an account, Pam keeps a scrambled code of your number, not the number. We keep it only so Pam does not text you if you join later. Nobody reads it. If you text START, we delete it.

**What the line depends on (Nico to confirm; each is a pin once the migration is on a branch):**
1. **The key is a keyed hash, not `digest()`.** The line says "scrambled." That is true of an HMAC with a Vault key; it is not true of the unsalted SHA-256 rows already there.
2. **Existing rows.** An unsalted hash cannot be re-keyed (the number is not kept), so the migration must delete the `phone_stops` rows it replaces. Live, that should be zero rows, because `sms-inbound` has never been on; Nico to read back `count(*)` before the line is signed. The same holds for `support_texts_log.phone_hash`: it needs the keyed hash too, or Privacy has to name a second, weaker record. That log is empty while answering by text is off.
3. **Which columns.** "No readable number, no message, no count" leaves `stopped_at`. If it stays, the line says *and when*; if it goes, the line is shorter. I prefer it gone: nothing needs the time.
4. **How long it is kept.** Nothing deletes a stop but START (`record_sms_start`). A stop that is kept until the person asks is what a STOP means, so the line says "until you text START", not a number of days. If Nico or Will wants a limit (say two years), the line and a purge change together.
5. **What happens when the person joins.** Either the stop is copied onto their account (`sms_stopped_at`) and the code is deleted, or it stays and is looked up. The line needs to say which. If the account is later deleted, does the code come back? A person who deletes their account and has been stopped should stay stopped; that is the safe answer and the line should be true of it.
6. **Who joins.** The comparison needs the number at sign-up, which Pam has by then. Nothing is read at STOP time except the incoming number from Twilio, which Pam already receives.
7. **No other place.** Not in logs (`sms-inbound`'s logs and the Edge Function's `console.log`), not in `audit_log.meta`. `record_sms_stop` writes `audit_log` for a known profile only; the no-account branch must write nothing there.

**Pins I will write when the migration is on a branch** (same shape as `privacy-counter-line.test.ts` and `error-log-line.test.ts`): the migration uses `hmac(` and a Vault secret, not `digest(`; the table has exactly the columns the line names, RLS forced and no grants; `record_sms_start` deletes by the same code; the no-account branch inserts nothing else; the Privacy line exists in all seven languages and `legal.ts` counts it.

## 3. What it takes to ship

In this order, each one a different person: Nico deploys `sms-inbound` and confirms the live tables are empty; Sage signs the `texts.p4` line (and, if she wants, "text START" in `reminders.stopped.body` and the support post); Will signs; I translate six languages, change `legal.ts` to `section('privacy','texts',4)`, run `legal:date privacy <day>` and `copy:ack`, and write the pin; the support post changes in the same push. The line goes live the day `sms-inbound` turns on.
