# D-606 — Messages written to Pam are read by the Pam team, in a list of their own

**Date:** 2026-10-18 · **Branch:** `claude/messages-pam-s0-s1a`

**Decided by:** Will, 18 October 2026 (D-605: messaging Pam is a conversation in everyone's Messages), with the list apart from `ADMIN_CAN_SEE` by Lena's recommendation, taken by the merge desk the same day ("take it. Keep ADMIN_CAN_SEE exactly as it is").

## What

- **`PAM_TEAM_CAN_READ`** (`packages/config/src/transparency.ts`) is a list of its own, with one entry, `messages_written_to_pam`: the messages and photos in a person's one Pam conversation, and Pam's replies. Read by `is_pam_team()` (today exactly `is_super_admin()`) and nobody else. `ADMIN_CAN_SEE` does not change, and `pam-team-can-read.test.ts` fails if the entry ever appears in it. `ADMIN_CANNOT_SEE.message_bodies` stays true of the guide and of every other conversation; its comment says where the exception is.
- **A conversation can be of kind `support`** (migration `20261018071550`). Nothing creates one yet.
- **A message may have no author** (`20261018071552`, alone in its file: `drop not null` has DROP in it and the connector may hang, D-387; if it refuses, Will pastes it). `20261018071643` adds `system_key` and `system_vars` and the rule: a message has an author **or** a key, never both, never neither (`messages_author_or_key`). The welcome and the out-of-hours reply are written by no person; the app draws the words in the reader's own language from the key. A system message's `body` is the empty string, not null, so `messages_has_content` is unchanged.
- **The two new columns are outside the columns a signed-in person may insert** (the table's insert grant is by column), so no client can write a system message at all: `permission denied`, before any policy is asked. Only functions that run as the database will.
- **The switch and the hours** (`20261018071553`): `app_settings.pam_messaging_live` seeded `off`, and `pam_hours` (Monday to Friday, 9:00 to 17:00, America/New_York, until Will says otherwise). With the switch off nothing is created or shown.

## Why a list of its own

The guide's list is what a member is told their case manager can see. A Pam team that reads message bodies is a different thing, said to the person in a different place (the legal pages, never in the conversation: Will, "Keep the UI clean"). One list per reader means neither can be widened by editing the other, and a test can hold each to its own words.

## What a later session might reverse

- `is_pam_team()` is `is_super_admin()` for now. Adding support staff means widening one function, and is two sign-offs from Will (a new reader of message bodies, and a new role).
- A null sender could instead be a fixed "Pam" profile row. It was rejected in the plan: a fake account every policy and count would have to learn to ignore.

## Found while building: a text alert already exists for messages

`queue_message_text_alert` (`20261010134429`, D-478) queues the opt-in "message waiting" text for every other member of a conversation. A Pam reply will therefore queue one for a person who opted in to message texts, when `texts_live` is on. System messages have no sender, so `m.profile_id <> new.sender_id` is never true and none is queued for them. The plan said "bell only"; this is a text the person already asked for. Reported to the merge desk; not changed here.

**Proof:** `pam-team-can-read.test.ts` (fails with the entry in `ADMIN_CAN_SEE`); DB test 79 (fails without the four migrations: "a conversation can be of kind support, got 0 row(s)"); the full `packages/db` suite passes.

## Added with the rest of slice 1 (18 October 2026)

- **Who reads what** (`20261018072101`, test 80): the Pam team reads a support conversation, its members, its thread row and its photos, through policies that name `is_pam_team()` and `kind = 'support'` and nothing else. A guide, a program lead, another member read none of it. A limited account can write to its own Pam conversation (D-413 is narrowed for Pam only). Every table policy is `to authenticated` so a visitor is never asked to run a function it may not.
- **The bell and the text** (`20261018073011`, test 83): a Pam conversation uses the existing `message_received` kind. The person is told "Pam", never the first name of the person on the team who wrote; the team is told the person's first name; one unread row per conversation, not one per message; system messages tell nobody. **A Pam conversation queues no "message waiting" text** (`queue_message_text_alert` leaves it out), as the plan said; this is the choice recorded above, one line to reverse.
- **The limit** (`20261018073013`): 30 messages an hour, 150 a day, 10 photos an hour, on the person only, the same for every account; refused as `PAM_RATE_LIMITED`. There was no general message limit before.
- **The out-of-hours reply** (same migration): once per stretch of closed hours (`pam_threads.last_auto_reply_at` against `pam_last_close()`), a system message `pam.away` carrying `opensAt`. A message from the person also reopens a closed thread. Every team message is audited as `pam.reply` about the person, with nothing of the text.
- **Erasure and reports** (`20261018073016`): erasing the person deletes the whole conversation at once. **A message to or from Pam cannot be reported** (`report_message` refuses): otherwise the report would copy Pam's words into `reports`, where the person's case manager reads them, the one door through which a guide could read a Pam conversation.
- **Found, not fixed here: message photos are never swept.** Only `staff-photos` has a sweep (D-590). The file of a photo sent in any conversation stays in storage after the account or conversation is erased, because only the Storage API removes a file. Pam's photos will join the nightly sweep for message photos in slice 3, which will cover every conversation; the Privacy line "photos too" depends on it.
