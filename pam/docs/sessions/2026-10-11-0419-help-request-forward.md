# 2026-10-11 — help request forward

**Branch:** `claude/messages-help-request-forward` · **Lane:** Messages & notifications

## What changed

New edge function `help-request` (handler, index, a copy of the email sender), built off behind `HELP_REQUESTS_LIVE`. Migration 20261011041940 and DB test 53: the per-caller and overall limit. Tests in `packages/config/test/help-request.test.ts`. Contract for Wren in `docs/help-request-contract.md`; setup in `docs/email-setup.md`. D-521.

## What was wrong, and what missed it

Nothing was wrong; this is new. A28's text-reply tool (Will said yes) builds on it and is next.

## Decisions made

D-521.

## Verified

Config tests (twice), the full DB suite, the new function against fake database and fake email service. No email was sent, and none will be before Will says "test it".

## The text reply (later in the same session, D-524)

Migration 20261011042645 and DB test 54: `phone_stops`, `support_texts_log`, `send_support_text`, `record_sms_stop/start` keep and clear a stop for a number with no profile, and `claim_outbound_messages` cancels a support text to a stopped number. Templates `support_reply` and `reply_no_read` (unsigned). Page `/reply/` (super admin; `SupportReplyScreen`), eight new strings in seven languages (Lena's to read; mine are drafts), `e2e/support-reply.spec.ts`. Samples file: sample 10 and the opt-in sentence.

## Left undone

Mira: apply the migration, set the secrets (`HELP_REQUEST_SALT` is new), deploy with `verify_jwt: false`. Wren: build the form on the contract. Held for Will's card a61: the inbound forward to hello@, the auto-answer to replies (template written, unsigned, not wired), and the form's phone field plus the "Reply by text" link in the request email.

## Needs a human

Will: "test it" for this function (one request to hello@joinpam.org only).

## Deploy fix (11 October, after the first deploy failed at bundling)

The merge desk's deploy tool turns the line-separator escapes in a regex literal into real line breaks, so `handler.ts` stopped compiling. The control-character class is now built from character codes; a test strips the characters and keeps the escapes out of the source. No other function had the pattern.
