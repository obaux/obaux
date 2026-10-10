# 2026-10-10 — messages address deleted

**Branch:** `claude/messages-member-address-deleted` · **Lane:** Messages & notifications (Nico)

## What changed

- Migration `20261010151208_…` (expand, no DROP): `address_removed_at` and a check; `mark_invite_link_email_sent` removes the
  address; `purge_invite_email_addresses()` (every claim, nightly, once now); the claim never hands over a removed address;
  `invites_log` shows none for a removed one.
- Test 48 (new, 28 checks); test 40 adapted (it found the sent row by its address).
- `docs/email-setup.md`.

## What was wrong, and what missed it

An address typed by someone who had not agreed to keep one was kept for ever. The privacy sweep found it (Lena).

## Decisions made

D-487: placeholder rather than NULL (D-387), staff's typed copy goes too, purge in the claim plus nightly.

## Verified

Full DB suite; config tests.

## Left undone

"Sent by email" in the invites log (copy + Accounts' screen). Making the column nullable (a pasted migration, if wanted).

## Needs a human

The merge desk: apply the migration. Will: approve the privacy wording (his card).
