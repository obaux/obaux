# STOP, START and the number that stopped: a Privacy read

**Written by:** Lena (Languages & legal), 19 October 2026, for Mira, Nico, Sage and then Will. **Asked:** Mira, 19 October, 01:00, two reads from Nico that gate texts going live.
**Read:** `claude/messages-stop-needs-start` @ `7b980bc6` (migration `20261019005247`, the app's `useReminderConsent.ts` and the Reminders page), the live `phone_stops` and `support_texts_log` tables (migration `20261011042645`, live as `20261011093720`), `sms-inbound`, every English line about texts, the support site and the SMS filing text.
**Nico's draft** (`claude/messages-stopped-numbers` @ `0a8299ed`, `docs/legal/2026-10-19-stopped-numbers-draft.md` and migration `20261019010454`) arrived at 01:09, after the first version of this note was sent. Sections 1 to 3 were written from Mira's description; **section 4 reads the draft itself and answers his five questions. Where they differ, section 4 is right.**
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

## 4. Nico's draft, read (`0a8299ed`, 01:10)

The draft is what Mira described: `phone_stops (phone_hash, stopped_at)`, the hash an HMAC-SHA256 with the key `phone_stop_key` in the Vault (prefix `k1:`), `stopped_at` cut to a day, a trigger that puts the stop on an account when it is created with, or changes to, that number (texts stay off, never a yes), START removing the row. Four things in it change what the Privacy line may say, and one is a gap.

**a. The service role can compare a number to the list. The line must not say "nobody can".** The key itself is out of reach (`phone_stop_key()` is revoked from `service_role` and test 86 pins that). But `phone_hash(text)` and `phone_is_stopped(text)` are both granted to `service_role`, and the migration revokes `phone_stops` from `public, anon, authenticated` only, so `service_role` can also read the table. Anyone holding the service-role key can therefore call `phone_is_stopped('+1…')` for any number and learn whether it is on the list, which is the test the keyed hash was meant to take away from someone who has only the table. Some of that cannot be removed: Pam has to ask about a number it wants to text. What protects the person is that a copy of the table (a backup, a dump, a leaked export) is useless without the key. So the line says what is true: **the list holds no number, and Pam's system can only check whether a number it already has is on it.** "Nobody can turn it back into your number", in Nico's candidate, is not true of the service role or of the database owner. Cheap hardening, his call: revoke `execute` on `phone_hash` from `service_role` (only the definer functions call it) and `select` on `phone_stops`, so the service-role key can ask a question but not read the list.

**b. The row stays after it is carried onto an account, and the account's own STOP does not make a row. Two records, one rule is better.** Today: a STOP from a number with no account makes a row, and the row stays when the person joins; a STOP from a number that already has an account sets `sms_stopped_at` on the account and makes no row. When the account is deleted, the second kind is forgotten with it and the first is not. That is not the same promise for the same words, and it breaks two things Privacy already says: "Ask us to delete it and we will" (`how-long.p1`, `your-choices.p2`) and "after six months we delete that too" (`how-long.p3`). My recommendation, for Nico and Mira to decide: **delete the row when the stop is carried onto the account** (the account then holds it; deleting the account forgets it, as with every other thing Pam keeps). The list then holds only people with no account, which is what the line is about. A person who deletes their account and comes back starts with texts off and must say yes again, so nothing is texted without a fresh yes. The other way (keep the row for good, and write one for every STOP) is defensible as carrier practice, but then the line has to say it is kept after you delete your account, and `how-long` needs a clause. It must be one or the other before Will signs.

**c. Old plain-hash rows still count.** That is the safe direction for the stop, but the line cannot call them "scrambled." Live they should be zero rows: `sms-inbound` has never been on, and answering by text is off. Nico to read `count(*)` of `phone_stops` live. **If it is 0, take out `phone_hash_legacy` and the `or` branches** (less code, and then the line is true of every row). If it is not 0, the line names a second, weaker kind or those numbers are asked to text START. `support_texts_log` keeps a plain SHA-256 of each number a super admin texted; the draft leaves it, which is fine while answering by text is off (D-547), but **it is a record about a person with no account that Privacy does not name**, and it needs the keyed hash and its own line the day answering by text turns on (card a61). Not this line's job.

**d. A stopped person who joins sees the Texts-are-off screen and has no way back unless it says so.** The app already shows it for a stopped account. For a number that texted STOP first, `reminders.stopped.body` says "You replied STOP", which is true of the person who did and not of someone who later got the number. A wording true of both is "Pam got a STOP from your number". Once `sms-inbound` is live the screen also has to say how to turn texts back on, and which number to text START to, because a person who joined later may have no Pam text to reply to. Sage's words; not before `sms-inbound` is on.

**His five questions.**
1. *Is a keyed hash of a non-user's number personal data?* Treat it as personal data. Pam can use the key to link it to a number it holds and to an account, which is the whole point of it. That is why it needs a line, not a reason to avoid one. Whether it is enough is a lawyer's question; as a Privacy-page matter, a line that names it, says what it holds and how it ends is enough, and nothing more is needed on the page. Not legal advice.
2. *Retention?* Until START, no expiry, and the line says "until you text START" (or "or join Pam", if b is taken). A number given to someone new is treated as stopped until that person texts START; that is the safe error, and the cost of an expiry is texting a person who said stop. No expiry.
3. *Key handling?* An engineering note, not a Privacy line, but it is a launch item, not a comment: **if the key is lost or the project is moved without the Vault, every `k1:` stop silently stops matching and people who said STOP are texted.** `phone_hash` raises `PHONE_STOP_KEY_MISSING` rather than returning null, which is right. Put the key in the backup/restore and project-move checklist in `docs/before-launch.md` and add a restore check that a known stop still matches.
4. *Who could compare?* Database owner, and the service role (a). Acceptable if the line says only what is true.
5. *"You replied STOP" for someone who did it before joining?* Right for them, wrong for a later holder of the number. See d.

**The line, revised (not signed; Sage rewrites).** Taking b as recommended:

> If you reply STOP to a Pam text and you have no Pam account, Pam keeps a scrambled code of your number, and the day. It is kept only so Pam does not text you if you join later. The list has no number in it, and Pam can only check whether a number it already has is on it. We delete the code when you text START, or when you join and the stop moves to your account.

If the row is kept after joining instead (b the other way): end with "We delete the code only when you text START, even if you join or delete your account," and add a clause to `how-long`.

**Pins when it is built:** the migration uses `hmac(` with `vault`, not `digest(`; the table has exactly `phone_hash` and `stopped_at`, the second a `date`; no client role reads the list; the carry trigger writes `sms_stopped_at` and never `sms_enabled` or an alert; the audit row carries `{"carried": true}` and no number; START deletes by the keyed code; a carry removes the row (if b is taken); the Privacy line exists in all seven languages and `legal.ts` counts it.

## 5. Mira's answers (01:11) and what they change

Mira's decisions, which crossed with section 4: the plain-hash fallback goes (live: `phone_stops` 0 rows, `support_texts_log` 0 rows, read back); the table is **the keyed hash only** (`stopped_at` goes, so there is no day); on joining the stop carries onto the account; **when a stopped account is erased, its keyed hash goes back into `phone_stops`, so the person stays stopped**; no `audit_log` or log line on the no-account branch; `support_texts_log` is keyed the same way and needs its own Privacy coverage before answering by text goes on.

What that does to the line:
1. **No day.** My "add the day" (to Sage) is withdrawn; the table holds nothing but the code.
2. **The line is no longer only about people with no account.** It covers a person who replied STOP and has no account, and a person whose account was deleted after a STOP. "…and you do not have an account" (Sage's cbbe22cd) is too narrow. The record is kept after the account is gone. Candidate: *"If you reply STOP to a text from Pam and you do not have an account, or you delete your account later, Pam keeps a scrambled code made from your number, not the number itself. We keep it only so Pam does not text you again. Nobody reads it. If you text START to Pam, we delete it."* (Sage rewrites; no contractions to match p1 to p3.)
3. **It keeps a record about someone after their account is erased, which `how-long` and `your-choices` must not contradict.** `how-long.p3` says what Pam keeps after an account is deleted: a short record, six months, "no name, phone number or email in it." The code is derived from the phone number and is kept past six months, until START. The p4 sentence "or you delete your account later" names it, which is enough for `how-long.p3` to stay true ("that" is the short record). `how-long.p1` ("Ask us to delete it and we will") is about the account and what is in it, and stays true. **`your-choices.p2` ("ask us to delete [what we keep about you]") is where it would be false if Pam deleted the code on a deletion request; the rule for Pam's team is: a request to delete everything leaves the code, tells the person why, and says START removes it.** That rule is for Mira and Will; it is not a Privacy edit.
4. **Pin the erase path as well as the STOP path.** The erase function that puts the hash back is a new write of a person's number-derived code at the moment they ask to be forgotten. The pin reads it: it writes only the keyed hash; no other column, no audit row with a number; it runs only for an account with `sms_stopped_at`; START removes it.

Before-launch (see the entry) now says: `phone_stops` and `support_texts_log` were read back empty; the old-hash code goes; `support_texts_log` is keyed and gets its own line before answering by text goes on (card a61).

