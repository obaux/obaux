# 2026-10-10 — Languages & legal — the privacy page names the company that sends email

**Branch:** `claude/lena-mail-service-privacy` (from `main` at `2ea542d`, the promise sweep and the Spanish-word fix not included: this touches
different keys) · **Lane:** Languages & legal (Lena)

From Mira (the merge desk), 14:40: Will approved a21 on 10 October at 14:37 UTC ("Approve", Control Room), the English as I wrote it: *"When Pam emails
a case manager or a program, a company that sends email for us gets the email address and the email. It may not use them for anything else."*
Put it on the privacy page, translate it into the other six, sign the English as his, and check it still covers the expired-link email (D-476);
if it should also cover someone who asks for a new invite link, propose English, do not widen it.

## What changed

- **`en.json`:** `privacy.s.sharing.p4` = Will's sentence, word for word; the fourth and last paragraph of "Who else gets your information".
- **Six translations** (es, pt-BR, zh-CN, zh-HK, ru, ar), in each bundle's own words for case manager, program and email; `copy:ack`ed.
- **`legal.ts`:** the sharing section counts four paragraphs.
- **`test/legal.test.ts`:** pins Will's English (it fails if it is changed without him), that it is the section's last paragraph, and that every language
  has it translated.
- D-482 (Will's approval, with date and time, is recorded there and in the test); changelog fragment; before-launch item.

## What was wrong, and what missed it

- **The sentence does not cover everybody Pam emails.** The expired-link page asks the person holding the link for their address, and the sender mails it
  for a member too (D-476). "A case manager or a program" leaves the member out. **Proposed English (not applied):** "When Pam sends an email, a company
  that sends email for us gets the email address and the email. It may not use them for anything else."
- **A line on the same page is now untrue.** `privacy.s.what-we-keep.p7` ends "Members are never asked for an email." A member whose invite link ran out
  is asked for one on that page (`invite.expired.email`). The address is kept in `invite_emails` (an outbox: no client can read it; the super admin's invites
  log shows it; it is not deleted when the email is sent). **Proposed English (not applied):** "Members are asked for an email only if their invite link has
  run out and they want a new one by email. We use it only to send that link." If the address should go once it is sent, that is a database change first.
  Both are in D-482, for Will through the merge desk. What missed it: D-476 added the member email with "No new words", and nothing ties the page's
  claims to the screens that collect the data. The privacy and terms tests pin their own wording, not what the app asks for.

## Decisions made

- **D-482** — the sentence, where it sits, why now, and the two things it does not cover.

## Verified

(see the READY note: head, browser suite, privacy fit audit)

## Left undone

- Not applied, waiting on Will: the two proposals above.
- Piper's review-queue strings (about 38), the honest booking (2) and the program switch (8): not on `main` yet; I review them when they are.
- A native reader for all six translations (before-launch).

## Needs a human

- Will: the two proposals in D-482 (the wider sentence; the "Members are never asked for an email" line).
- Whoever sets up the email service: this page must be live before the first email goes out.
