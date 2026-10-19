# 2026-10-19 — accounts invite once

**Branch:** `claude/pam-invite-once` · **Lane:** Accounts & invites

## What changed

- **Migration `20261019021939_an_invite_asked_for_twice_is_made_once.sql`** (add only, no drop, no switch):
  - adds `invites.request_id` (uuid, nullable), with a partial unique index `invites_request_once` on
    (created_by, request_id) where it's set;
  - `invite_create_once` (internal): takes a transaction lock on (inviter, id), hands back an existing invite when the details
    match, refuses `INVITE_REQUEST_REUSED` when they don't, and otherwise makes the invite through 0086's `invite_create` and
    stamps the id;
  - `create_invite_once` and `create_staff_invite_once`: the new doors, granted to `authenticated` only. The old doors are
    untouched.
- **App:** `createInvite` calls the new doors with `p_request_id`. `InviteNewView` keeps one id per set of details (role,
  name, number, email, city), so a retry sends the same id and any change makes a new one.
- D-620 records the design and Mira's three changes.

## What was wrong, and what missed it

Iris's D-618 table: a timeout followed by Try again made a second invite and queued a second staff email. Nothing could have
caught it in the app, because only the database knew the first one was made.

## Decisions made

D-620.

## Verified

- `pnpm --filter @pam/db test`: all database checks pass, including 22 new ones in test 87. They cover the repeat (one
  invite, same code, the number and name written differently still match), the refusal on a different name, number, role or
  email, one queued staff email, another inviter's same id, every old rule kept, no id refused, and anon refused.
- e2e `invite.spec`: two new tests (timeout then Try again: one invite, the same id, one code; a fixed typo after a timeout:
  a new id). Both fail on main, 6 of 6. invite, admin and account: 135 passed.
- Web unit tests: 229 passed. tsc is clean. Storybook builds (its fixtures match `create_invite*`, so they cover the new
  names).
- Not tested: two calls with the same id at the very same moment. That needs two database connections; the transaction lock
  is what covers it.

## Left undone

- Retiring `create_invite` and `create_staff_invite`, in a later migration with Will present, once the app on the stores has
  moved.
- Order matters: the migration must be live before the app that calls `*_once` ships.

## Needs a human

Nothing. Nico reviewed the migration (02:37, "sound, ship it"); his two suggestions are in test 87 (a refused first attempt, then the same id with a fixed number, makes the invite; another inviter cannot read the ids). Lena classified `invites.request_id` as not personal (02:37). Add-only, so it applies without Will's prompt, in order after the error log and Nico's two STOP migrations (Mira, 02:38).
