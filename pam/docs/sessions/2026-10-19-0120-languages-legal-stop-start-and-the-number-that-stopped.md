# 2026-10-19 — languages & legal: STOP, START and the number that stopped

**Branches:** `claude/lena-stop-start-read` (docs, off main 9aac8b6f) and `claude/lena-stopped-number-pins` (one test, on Nico's `claude/messages-stopped-numbers` @ `1b821f37`) · **Lane:** Languages & legal (Lena) · from Mira (01:00, 01:11, 01:14) and Nico

## What changed
- **A read** (`docs/legal/2026-10-19-stop-start-and-stopped-numbers-privacy-read.md`): no line promises texts can be turned back on; the support post and the filed opt-out message name the way back and are true only once `sms-inbound` is live; a stopped-number list needs a Privacy line and already did.
- **Four catches in Nico's draft:** the service role could still compare a number to the list (now closed out of `phone_hash` and the table); the row outlived the account while an account's own STOP did not (now deleted at the carry, erasure forgets); old plain-hash rows and `support_texts_log` (now gone / keyed); the Vault key is a launch item.
- **Pins** `test/stopped-number-line.test.ts`: one column; HMAC with the Vault key; no old form; the log keyed; service role closed; no-account STOP writes the code and nothing else; START deletes it; the carry never writes a yes and deletes the row; nothing on erase writes the list; no notice names a number. Six mutations each fail the right test.
- **before-launch** and **STATUS** entries.

## Open
- Sage sets `privacy.s.texts.p4` (her `dcc5fcc2` without the date; not `053039cd`, which assumes the put-back Mira reversed at 01:14); Will signs it; then six translations, `legal.ts` texts 3 to 4, `legal:date privacy <day>`, `copy:ack`; the nine p4 checks run once it exists.
- "Text START" in the support post and `reminders.stopped.body` ("Pam got a STOP from your number", with the number to text) waits for `sms-inbound`; Sage will write it.
- `support_texts_log` needs its own Privacy line before answering by text goes on.
- Not done in this session: the guard counting choice controls (#147) and the two retired keys (#146) wait for b77.
