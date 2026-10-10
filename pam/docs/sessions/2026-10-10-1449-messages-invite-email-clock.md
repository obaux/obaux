# 2026-10-10 — messages invite email clock

**Branch:** `claude/messages-invite-email-clock` · **Lane:** Messages & notifications (Nico)

## What changed

- Migration `20261010144844_…` (expand): the vault secret `dispatch_secret`, `dispatch-sms` rescheduled with the
  `x-dispatch-secret` header, `send-invite-emails` scheduled every five minutes. Not applied to live.
- `packages/config/test/database-clocks.test.ts` (6 tests) on the migration's text.
- `docs/email-setup.md` (order, Will's dashboard steps) and `docs/sms-setup.md` (the warning is replaced by the order).

## What was wrong, and what missed it

A project-wide secret needed by one function would have broken the other's clock. The SMS runbook warned of it from
one side only.

## Decisions made

D-484.

## Verified

DB suite (the migration runs and takes the guard path); config tests twice.

## Left undone

Applying it, deploying `send-invite-emails`, and Will copying the secret: the merge desk and Will.

## Needs a human

Will: the five dashboard steps in `docs/email-setup.md`, after the merge desk says the migration is live.
