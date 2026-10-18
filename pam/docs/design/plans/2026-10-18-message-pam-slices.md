# Message Pam: the build, in slices (nothing built yet)

**Status:** slice plan for the merge desk, 18 October 2026, before any code. Nico (Messages & notifications). Builds on `2026-10-18-message-pam.md` (the model, still right) and Ava's `2026-10-18-message-pam-admin.md` (the super admin's screens). Will's answers are D-605.
**Everything ships behind a switch that is off.** Each slice is safe on `main` with the switch off, and each can be merged, tested and applied on its own.

## The switch

`app_settings.pam_messaging_live` (the table `invite_emails_live` uses: readable by everyone, a missing or unreadable row is off). Seeded `'off'`.
- Off: `open_pam_conversation()` returns nothing and creates nothing; the app shows no Pam row, no always-on tab, no "Write to Pam"; Contact Pam and Help behave as they do today (the website help desk). The team's policies and functions exist but have nothing to read.
- On: Mira flips it with SQL, **only after Will has signed the rewritten Privacy and Terms lines** (Lena, D-413) and they are live. One line to turn on and one to turn off, both written in the migration's header, as `invite_emails_live` does.

## Assumptions I am building to (tell me if one is wrong)

1. **The Pam conversation is created on first use, not at sign-up.** The app calls `open_pam_conversation()` once per session when signed in and the switch is on. That puts the welcome message in every account's list from the first load after the switch, creates nothing for people who never open the app, and needs no backfill. It is idempotent (a unique index: one per person).
2. **The welcome counts as unread,** so the Messages tab shows a red "1" until it is opened (D-586: red is for what is new). It is an invitation to reply, which is the point.
3. **Super admins have no Pam conversation.** They are Pam. Case managers, program leads and members all do.
4. **System messages have no author.** The welcome and the out-of-hours reply are written by no person, and a `messages` row needs a `sender_id`. So `sender_id` becomes nullable, with a check that it is null only with a `system_key`, and two new columns, `system_key` and `system_vars` (jsonb), say what to show. The app draws the words in the reader's own language from the key (so both are in all seven languages and follow a later change of language), and the time in the reader's own format from a timestamp in `system_vars`. Nothing in the data names a person.
5. **Photos reuse the existing private bucket** `message-photos` (0079, D-394: private, JPEG/PNG/WebP, one folder per conversation, 5 MB, re-drawn on the phone). The asker is covered by the policies already there; the team gets one new policy pair scoped to folders that are support conversations. Same privacy statement, no second bucket to describe. No documents.
6. **The "general anti-abuse limit" does not exist yet.** I checked: nothing limits how fast anyone can send a message today. Slice 1 adds one for Pam conversations: 30 messages an hour and 150 a day per asker, 10 photos an hour, the same for a limited account as for everyone else, refused with a coded error the app turns into a calm line. The team is not limited.
7. **The business hours** are one setting (`app_settings.pam_hours`: time zone, days, open, close; default Monday to Friday, 9:00 to 17:00, `America/New_York`). The out-of-hours reply goes once per stretch of closed hours: `pam_threads.last_auto_reply_at` remembers the last, and a person's message sends one only if it is older than the most recent closing time.
8. **"Pam" in the bar and Pam's mark above the thread** come from `conversation_partners()` returning a fixed Pam row for a support conversation, and Dot's x1 header (the mark centred, "Pam" under it, the bar showing "Pam" once it scrolls away).

## Slice 0: the record and the list (no database, no screens)

- This plan, D-605 (Will's words) and the decisions below, claimed as each slice needs them.
- `PAM_TEAM_CAN_READ` in `packages/config/src/transparency.ts`, with one entry, `messages_written_to_pam` (messages and photos in the Pam conversation), and `ADMIN_CAN_SEE` untouched; the contract test (in the way of `program-booking-line.test.ts`) that holds the list, the Privacy paragraph, the transparency line and Terms together, and fails if the entry ever appears in `ADMIN_CAN_SEE`. Lena's `claude/lena-message-pam-privacy` supplies the lines; I do not write them.
- **Done when:** config tests pass, and the new test fails against an `ADMIN_CAN_SEE` that includes the entry.

## Slice 1: the database (the part Mira has to trust)

All expand; no DROP statement except where noted; each `security definer` sets `search_path = public, extensions`; applied by Mira, in order, after `list_migrations`. Names are the slugs `pnpm claim migration` will be given.

| # | Migration | What it does |
|---|---|---|
| 1 | `a_pam_conversation_is_a_kind_of_conversation` | `conversation_kind` gains `'support'`. Its own file: a new enum value cannot be used in the transaction that adds it. |
| 2 | `a_message_can_come_from_pam_itself` | `messages.sender_id` becomes nullable (**`alter column … drop not null` contains DROP, so it is alone in its file in case the connector hangs on it, D-387**), adds `system_key text` and `system_vars jsonb`, a check that `sender_id` is null only with a `system_key`, and widens `messages_has_content` to allow a system message with no body. Every reader treats a null sender as "not me". |
| 3 | `pam_has_a_switch_and_hours` | Two `app_settings` rows: `pam_messaging_live` = `'off'` and `pam_hours` (JSON). |
| 4 | `who_reads_a_pam_conversation` | `is_pam_team()` (today exactly `is_super_admin()`). `pam_threads(conversation_id pk, asker_id unique, status, last_team_read_at, last_auto_reply_at, created_at)`: RLS on, one policy (the team). Policies scoped to `kind = 'support'` and `is_pam_team()`: select and insert on `messages`; select on `conversations` and `conversation_members`; select and insert on `storage.objects` for `message-photos` where the folder is a support conversation. A new insert policy so a **limited** account can send in its own support conversation (it keeps `my_feature_allowed('chat')` and no-block; it drops only `is_active_account()`; a paused account still cannot sign in). `messages_select_conversation_member` and every other policy untouched. |
| 5 | `open_pam_conversation_and_what_it_says` | `open_pam_conversation()` (signed in; returns null when the switch is off or for a super admin; otherwise creates the conversation with the asker as its only member, the `pam_threads` row and the welcome system message, and returns the id). `pam_status()` (any signed-in person: switch, hours, whether Pam is open now, when it next opens). `conversation_partners()` returns the fixed Pam row for a support conversation, and the asker's first name for the team. |
| 6 | `the_pam_team_inbox_and_starting_a_conversation` | `pam_inbox()` (first name, role, region, program for a lead, last message, who wrote last, waiting-since, status, first line), `pam_set_thread_status()`, `pam_reply_times(days)`, `pam_set_hours()`, `pam_start_conversation(profile, body)` and `pam_start_program_conversation(service, body)` (each active lead gets their own, same text), all refusing anyone but the team (`ONLY_A_SUPER_ADMIN`). (`pam_mark_read` is not in this build; Will did not pick "Read by Pam".) |
| 7 | `a_message_to_pam_rings_the_right_bell` | `notify_on_message` branches for a support conversation: the asker is notified when the team writes or the system speaks (kind `pam_message`, "Pam", never the text); every super admin when a person writes (`pam_inbox_new`, collapsed per person). No row is ever queued for a text. |
| 8 | `pam_conversations_have_a_limit_and_an_after_hours_reply` | The send limit (a before-insert trigger on `messages`, support conversations only, coded `PAM_RATE_LIMITED`, the same for everyone); the after-hours reply (an after-insert trigger: a person's message, outside `pam_hours`, nothing sent since the last close, then one system message `pam.afterHours` carrying the next opening as a timestamp). |
| 9 | `an_erased_account_takes_its_pam_conversation_with_it` | After-delete trigger on `pam_threads` deleting its conversation (messages cascade; photos go with the existing storage sweep). The audit rows stay six months (D-443, D-599). |

**DB tests** (numbers claimed with `pnpm claim test`): *who reads what* (a super admin reads a support conversation and no `direct` one they are not in; a case manager, a program lead and another member read none; the asker cannot read another's; `pam_threads` closed to all but the team; a Pam photo readable by the asker and the team and nobody else); *the switch* (off: nothing created, nothing returned); *system messages* (a null sender only in support, only with a key); *limited accounts* (can send to Pam, still cannot send in a `direct` one); *the limit*; *the after-hours reply* (once per closed stretch, none in hours, none for the team, correct across both daylight-saving changes); *notifications* (nobody else rung, no `outbound_messages` row); *erasure* (conversation, messages and `pam_threads` gone at once, audit kept). `pnpm --filter @pam/db test` all green, and the privacy guard (D-587) updated.
**Decisions to claim:** the Pam conversation, who reads it and `PAM_TEAM_CAN_READ`; system messages, hours and the after-hours reply; limited accounts and the send limit; the switch.

## Slice 2: the member's side (the thing Will will feel)

All behind the switch; nothing changes with it off.
- **Messages:** the Pam row is first in everyone's list, with the welcome as its preview and the red "1". The tab shows for everyone with an account (`useMessagingReach` and `RoleTabBar`: D-511's hiding goes), still never for example data (D-511's other half stays). `open_pam_conversation()` is called once per session.
- **The thread** (`/messages/thread/?pam=1`, the way `?program=` opens a program's): Dot's x1 header (the mark centred over "Pam", the bar saying "Pam" once it scrolls), system messages drawn from their key in seven languages, no pinned card, no "who reads this" line, no Report or Block in the menu, no "Pam started this conversation" line. The after-hours reply is a system message drawn like any other.
- **Never lost.** A failed send keeps the draft in the box and says so with **Try again**; the draft is also kept for the session (`sessionStorage`, on the device only, cleared on a successful send; added to the privacy guard as an on-device note), so a reload does not lose it. A send refused by the limit says so calmly and keeps the draft.
- **The help routes.** Contact Pam (`Notice`, `ContactHrefProvider`) and Help's first row open the Pam conversation when signed in and the switch is on; signed out, or off, they are exactly what they are today. **This touches `Notice` and `ContactHrefProvider`, which the design lane wrote (D-512); I will make only the one branch and say so in the READY.** Help gains a "Write to Pam" row (Sage's words).
- **The bell** shows the asker's `pam_message` row and opens the thread.

## Slice 3: photos (screenshots)

- The composer's photo button in a Pam conversation (camera roll and screenshots; **no documents**; the microphone stays). The existing `shrinkPhoto` path (re-drawn, location dropped, 1600px) stays.
- **Upload with progress and retry:** a signed upload URL and an `XMLHttpRequest` for the progress bar; a failed upload keeps the picture in the composer with **Try again** and sends no message without it; cancel takes it out. This improves every conversation's photos, not only Pam's (the same composer), so it is the one place the slice reaches past Pam; it is tested for a `direct` conversation too.
- The team's photo policies come from slice 1 (migration 4); the photos wording is in `PAM_TEAM_CAN_READ` from slice 0.
- Tests: the photo e2e (send, progress, failure and retry, a photo shown to the team), and the storage who-reads-what test from slice 1.

## Slice 4: the team's side (with Ava)

Ava builds the inbox, the thread header with Close and Reopen, the start picker for people and programs, the hours editor and the Home row, on hooks I deliver: `usePamInbox`, `useOpenPamConversation`, `usePamStatus`, `useStartPamConversation`, `usePamHours`, with fixtures in `mockSupabase.ts` so Storybook runs (the seam is in both our files). I deliver the hooks at the tail of slice 1 so Ava is not waiting. **Pam starting a conversation** with a member, a staff member or a program is migration 6; a program's message fans out to every active lead (my question 4a, which Will did not contradict). `ThreadView` is mine; the inbox and `RequestsScreen` are Ava's.

## Slice 5: words, proof and the flow map

- **Words (Sage signs, Lena translates):** the welcome; the out-of-hours reply with the one 988 line (a time variable); the Pam row's strings; "Write to Pam"; the bell line; the send-limit line; the failed-send and upload lines (some exist). All new app sentences (A29). Until they land I use placeholders marked unsigned in `en.json`, which `copy:status` lists.
- **Legal (Lena):** the Privacy paragraph and the transparency line (the Pam team reads what you write to Pam, photos too), the second thing (the team can write to you as Pam), and the Terms line for limited accounts (`terms.s.limits.p2`); `legal:date` each. **These must be live before the switch.**
- **The e2e matrix** (`build:e2e`; network stubbed; seven languages and 320): sending and receiving; a photo with progress, failure and retry; the out-of-hours reply (once per stretch, with a stubbed clock); a limited account sending to Pam but not elsewhere; the bell for both sides; a failed send keeping its draft and Try again; the switch off hiding everything; Contact Pam and Help opening the Pam conversation signed in, and the website help desk signed out. Each new case is proven to fail on main.
- **Storybook:** a story for each new state (the Pam row, the thread with the welcome, an after-hours reply, a failed send, a photo uploading and failing), so `audit:fit` sees them in seven languages.
- **Flow map:** `Screens:` in the READYs (the Pam row, the Pam thread, Write to Pam).

## Order, and what each READY says

1. Slice 0 and migrations 1 to 3 first (the enum, the nullable sender, the switch): the smallest, so Mira can apply them before the rest.
2. Migrations 4 to 9 with their tests, and the hooks for Ava.
3. Slice 2. 4. Slice 3. 5. Slice 5's words and tests as they land. Slice 4 is Ava's, in parallel from step 2.
Each READY names the SHA, the migrations to apply and in what order, and what the switch still hides. **The switch goes on after:** every slice merged and applied, Lena's lines live, Sage's words signed and translated, the e2e matrix green on a `build:e2e` of main, and Will's yes.

## Risks

- **Messaging is the primary channel now** (Will). The two things most likely to hurt are a message that does not send and a notification that does not arrive; both have their own tests, and a failed send never clears the box.
- **`messages` gets a nullable sender.** Anything that assumed it is non-null breaks: I will read every reader (`useThread`, `useConversations`, `notify_on_message`, `report_message`, the translation and link-preview functions) and cover each in the tests.
- **A migration the connector hangs on:** migration 2 is alone for that reason; if it hangs, Mira pastes it through the SQL editor as before (D-387).
- **Daylight saving** in the after-hours reply; the test crosses both changes.
- **Dot's drawer sweep** owns the `BottomSheet` block in `NewMessagePicker.tsx`; nothing here touches it.
