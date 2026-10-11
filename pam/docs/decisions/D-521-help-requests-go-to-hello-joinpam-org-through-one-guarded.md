# D-521 — help requests go to hello@joinpam.org through one guarded function

**Date:** 2026-10-11 · **Branch:** `claude/messages-help-request-forward`

**Decided by Will, 11 October 2026 (A28)**: "let's forward to hello@pam, but only after they've explored the help desk. This is the flow. Problem -> help desk -> email forward". Mira asked for the function.

## Decision

The help desk's "Still stuck?" form posts to one edge function, `help-request`, which sends one email from Pam's address to `hello@joinpam.org` with the person's address as reply-to. The recipient is a constant in the code, not a setting.

- **Off.** `HELP_REQUESTS_LIVE` must be `on`; otherwise it answers 503 `{"live": false}` and touches nothing, and the form shows the address. Nothing is sent before Will says "test it".
- **Abuse.** CORS and an Origin check for joinpam.org and www.joinpam.org only; a honeypot (a filled one looks like success and sends nothing); length caps and a 12,000-character body cap; and a limit of three an hour a caller and thirty overall, kept in the database (`help_request_allowed`, migration 20261011041940, test 53) against a salted hash of the caller's address. The raw address is never stored; rows are forgotten after a day.
- **Content.** What they typed, how to answer them, the page, the language, the role if known. It reads no member record.
- **Deploy** with JWT verification off: the visitor has no Pam login.

## What a later session might reverse

Keying the limit on the caller's address only: a shared network (a library, a shelter) shares three an hour. If that bites, raise the per-caller number. The email goes through the same sender as the invite emails (a copy of `provider.ts`, with a test that they stay equal).
