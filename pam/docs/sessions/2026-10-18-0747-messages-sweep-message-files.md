# 2026-10-18 — messages sweep message files

**Branch:** `claude/messages-sweep-message-files` · **Lane:** Messages & notifications (Nico)

## What changed

- `supabase/functions/sweep-message-files` (handler + index) and the migration that schedules it nightly (`20261018074530`), after `sweep-staff-photos`'s shape (D-590). D-607.
- `packages/config/test/sweep-message-files.test.ts` (new) and one line in `third-party-hosts.test.ts`.

## What was wrong, and what missed it

- Message photos, documents and link pictures were never removed from Storage when a conversation or account was erased, though `privacy.s.how-long.p1` promises deletion. The database cascade cannot reach Storage; the staff-photos sweep (D-590) covered one bucket. Found 18 October while building Message Pam; nothing was orphaned yet (0 files live).

## Decisions made

- D-607.

## Verified

- The new test file passes (9 tests); the whole `@pam/config` suite passes with the function, the migration and the host-list line in place.

## Left undone

- Deploy the function and apply the cron (the merge desk). A test against a real project's storage is not possible from here.

## Needs a human

- Mira deploys `sweep-message-files` with JWT verification off and applies `20261018074530`; `DISPATCH_SECRET` is already set for the other clocks.
