# 2026-10-10 — messages email error detail

**Branch:** `claude/messages-email-error-detail` · **Lane:** Messages & notifications (Nico)

## What changed

`supabase/functions/send-invite-emails/provider.ts`: on a non-2xx answer Resend's JSON body is read and only `name` and
`message` are kept, any address replaced by `[address]` (and anything shaped like one of its keys by `[key]`), on one line,
cut to about 200 characters, and put in the thrown error, so a row's `failure_reason` reads e.g. "the email service answered
403: validation_error: The mail… domain is not verified…". A body that is not JSON, or has neither field, adds nothing.
Nothing else of the body is kept. Tests for the redaction (owner, recipient and sender addresses, a domain message,
non-JSON, other fields, keys, length) and for the handler recording it on the row.

## What was wrong, and what missed it

A 403 from the provider said nothing about why, so Will's test staff invite could not be diagnosed.

## Decisions made

None (the shape was the merge desk's). The rule that no address is ever logged is kept and tested.

## Verified

Config tests twice (1057); the three function files type-check strictly.

## Left undone

Redeploy `send-invite-emails` (merge desk).

## Needs a human

Nothing.
