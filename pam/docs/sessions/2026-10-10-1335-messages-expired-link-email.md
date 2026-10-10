# 2026-10-10 — messages expired link email

**Branch:** `claude/messages-expired-link-email` · **Lane:** Messages & notifications (Nico)

## What changed

- Migration `20261010133313_…` (expand): `invite_emails` gets `claimed_at`, `attempts`,
  `failure_reason`, and `claim_invite_link_emails` / `mark_invite_link_email_sent` /
  `mark_invite_link_email_failed` (service role only). Not applied to the live project.
- `send-invite-emails` (handler, render, bundle): sends the unsent expired-link rows too, same switch
  and secrets. Reply gains a `links` object; existing fields are the staff batch, as before.
- Tests: DB 39 (21 checks); sender tests 11 new (and the shared ones updated for the extra claim);
  the bundle generator writes `linkLocales`.
- `docs/email-setup.md`, `docs/before-launch.md`.

## What was wrong, and what missed it

Nothing sent the email the page promised ("Check your email").

## Decisions made

D-476: seven-day limit on a request; a member is emailed too.

## Verified

DB test 39 (renumbered 40 at merge) alone and the full DB suite; config tests twice (1026); the three function files
type-check with strict `tsc`.

## Left undone

Will's email setup. The privacy page does not mention the mail service (Lena).

## Needs a human

Will: the email setup (account, domain records, a send-only key).
