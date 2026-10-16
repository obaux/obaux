# 2026-10-16 — accounts staff photo cleanup

**Branch:** `claude/pam-staff-photo-cleanup` · **Lane:** Accounts & invites

## What changed

- This is build 2 of Mira's privacy builds from Lena's guard (D-587). Staff photos no account uses are removed
  (D-590).
- `apps/web/src/lib/staffPhoto.ts`: once a new photo is saved, the other files in the person's folder are removed.
  `olderPhotos()` picks them and has unit tests.
- New Edge Function `supabase/functions/sweep-staff-photos` (handler and index). Each night it keeps, in each
  folder, only the file the profile points at. Tests: `packages/config/test/sweep-staff-photos.test.ts`.
- Migration `20261016150353`: schedules it at 04:35 UTC with the vault's shared secret. Guarded, so the test
  database skips it.
- `data-collected.ts` says how long a staff photo is kept. `third-party-hosts.test.ts` lists the function, which
  reaches no outside host.

## Where account deletion runs

- There is no code path. The Pam team deletes the profile and auth user when asked, and a trigger
  (`record_account_deletion`) writes the audit row. A trigger can't remove a Storage file, so the nightly sweep is
  what empties a deleted account's folder. D-590 says why.

## Verified

- New e2e `staff-photo.spec.ts`, on all three projects (6 passed):
  - Changing the photo removes exactly the old file, never the new one.
  - When saving the new photo fails, nothing is removed.
- Sweep tests (8 passed):
  - A deleted account's folder is emptied, and a live one keeps only its current photo.
  - A taken-down photo goes, and a file under an hour old stays.
  - Every profile is read even when the server caps pages.
  - With no secret or a wrong one, nothing happens. If the profiles can't be read, storage isn't touched.
- `@pam/config` 1327 passed. `@pam/db` passes, and the migration's guard skips the clock there. Web `tsc` is clean
  and the lib unit tests pass (177).

## Left undone

- Mira deploys the function (`sweep-staff-photos`, JWT verification off, the same `DISPATCH_SECRET`) and applies
  the migration.

## Needs a human

- Nothing.
