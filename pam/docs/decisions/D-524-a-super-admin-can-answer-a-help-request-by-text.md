# D-524 — a super admin can answer a help request by text

**Date:** 2026-10-11 · **Branch:** `claude/messages-help-request-forward` (rides on D-521)

**Will, 11 October 2026, card a59:** yes to a phone number on the help form "so you can text back". **Mira's advice on card a61** (1–4, answering my four catches against D-460); items 1 and 3 await Will. Built off.

## Decisions (the parts built now)

1. **One answer, by hand.** A "Reply by text" link in the request email opens `/reply/?to=<number>` (super admin only). The super admin types up to 120 characters; Pam queues one `support_reply` text (`send_support_text`), through the existing dispatcher, so its last check still applies (160 characters with the STOP line, no emoji, nothing that names a person's situation). The page runs the same check first and shows the reason; the server's own refusals ("texts are not on yet", "that number asked Pam to stop texting", "too long") are shown as they are.
2. **Nothing is stored about the person.** The number travels in the link. The log (`support_texts_log`) holds when, who sent it, a SHA-256 of the number and the outcome: no words, no number.
3. **A STOP from a number nobody has is remembered** (`phone_stops`, a hash; START clears it). `record_sms_stop` used to ignore such numbers (D-460 point 6); now it keeps the stop. A queued support text to a number that stopped meanwhile is cancelled ("number stopped texts").
4. **Held by `texts_live`.** A support text is not an account text, so it waits like any reminder until Pam's texts are on; `send_support_text` also refuses while they are off, so Will is never told "queued" about something that will not go.
5. **Unsigned.** `support_reply` ("Pam: {reply}" plus the STOP line, the first text that number has had) and `reply_no_read` ("Pam: This number can't read replies. Write to hello@joinpam.org.") start with an empty `reviewedBy`. They cannot send until Will signs. `reply_no_read` is not wired to anything.
6. **Filing.** `docs/sms-campaign-samples.md` has the support-reply sample (10) and an opt-in sentence, marked pending Will's answer; the campaign description gained "one answer to a help request" (1,015 of 1,024 characters).

## Not built (held for card a61)

Forwarding a person's text replies to hello@ (D-460 stays: replies are not read or kept), the auto-answer to replies, and the form's phone field. The page and the function accept the number now; the email's link comes with the phone field.

## What a later session might reverse

Per-number STOP kept as an unsalted hash: a phone number has few possibilities, so the hash only keeps the number out of casual view, not out of reach of someone with the table. It is service-role only.
