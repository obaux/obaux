# 2026-10-18 — messages Message Pam, slice 0 and the first migrations

**Branch:** `claude/messages-pam-s0-s1a` · **Lane:** Messages & notifications (Nico)

## What changed

- `PAM_TEAM_CAN_READ` in `transparency.ts` (one entry, `messages_written_to_pam`), the comment on `ADMIN_CANNOT_SEE.message_bodies`, and `pam-team-can-read.test.ts`. `ADMIN_CAN_SEE` untouched.
- Four expand migrations: `20261018071550` (conversation kind `support`), `20261018071552` (`messages.sender_id` nullable, alone in its file), `20261018071553` (`pam_messaging_live` off, `pam_hours`), `20261018071643` (`system_key`, `system_vars`, `messages_author_or_key`). DB test 79.
- D-606, STATUS paragraph.

## What was wrong, and what missed it

- Nothing was wrong in what exists. Two things found while reading before building: the signed-in role's insert grant on `messages` is by column, so the new columns are unwritable by clients without any policy; and `queue_message_text_alert` (D-478) will queue the opt-in "message waiting" text for a Pam reply, which my plan had said would be bell-only. See D-606.

## Decisions made

- D-606. Kept `messages_has_content` as it is (a system message's body is the empty string) so the migrations are additions only.

## Verified

- `pnpm --filter @pam/db test` all green with test 79; test 79 fails without the four migrations ("a conversation can be of kind support": 0 rows). `pam-team-can-read.test.ts` fails when the entry is put in `ADMIN_CAN_SEE`.

## Left undone

- Slice 1's remaining migrations (who reads a Pam conversation, `open_pam_conversation`, the team functions, the bell, the limit and the out-of-hours reply, erasure), then the member's side, photos, words and the e2e matrix. Lena's lines in the contract test when they are on `main`.

## Needs a human

- Mira applies the four migrations in order after `list_migrations`. If the connector refuses `20261018071552`, Will pastes it.
- Decide whether a Pam reply may queue the opt-in "message waiting" text (see D-606) or Pam conversations are exempt.
