# 2026-09-17 — Member-to-member messaging

**Phase:** 1 (first chat/messaging UI) · **Sessions so far:** 25

## What changed

The first chat UI anywhere in `apps/web` — confirmed by grep before starting
that none existed. Two screens, both member-facing:

- **`/messages/`** — every conversation the signed-in member is already a
  part of, newest-activity first, with an unread mark; below that, anyone
  they have an *accepted* mentor or buddy connection with but have not yet
  messaged, each row opening (or creating) the conversation on tap.
- **`/messages/thread/?id=`** — reads and sends within one conversation.
  Confirms membership itself rather than trusting the query string (a bad or
  foreign id reads identically to "not a member" under RLS — both `not_found`
  rather than one of them silently rendering as "no messages yet").

New library code: `useConversations`, `useConnectablePeople`, `useThread`,
`openConversation` (all `apps/web/src/lib/`). A `NavTile` for it was added to
Home, gated on the account's real role (`me.role === 'member'`) — see D-150
for why this deliberately does not follow a super admin's "Viewing as"
preview.

Nothing in `packages/db` changed. Every query reads and writes exactly what
RLS (`0007_rls.sql`) already allows for a conversation member — no service
role, no new policy, no new table. `messages` still has no admin `select`
policy of any kind, so this session changes nothing about D-074's
supervised-chat model: a case manager still only ever sees a message if it is
reported.

~20 new i18n keys, added key-for-key in `en.json`/`es.json`. `pnpm --filter
@pam/config test` passes, including the dignity-language and placeholder-parity
checks.

## What was wrong, and what missed it

**`conversations.last_message_at` has existed since 0005 and nothing has ever
written to it.** Grepped every migration for the column name; the only hit is
its own `create table`. I had planned to sort the conversation list and
compute the unread flag from it before checking — the design would have
shipped a list that never reordered and a bell that never lit, silently,
because the column reads `null` forever and nothing would have thrown. Caught
by reading the schema before writing the query, per the task's own
instruction, rather than by a test. `useConversations` derives recency and
unread status from `messages` directly instead (D-149) — correct today,
flagged as not scaling past a small number of messages per conversation.

**RLS lets a client create a conversation with an arbitrary profile id.**
`conversations_insert_participant` and `conversation_members_insert` check
only "is this account active and is chat on" (chat is permanently on, 0031) —
neither checks who the other party is. So "member-to-member chat, scoped to
people you have an actual relationship with" is, as shipped, a property of
this screen's own restraint (`useConnectablePeople` only ever offers accepted
`connections`), not a property the database enforces. Recorded in full as
D-148, including exactly which policies to extend and how. This is the one
piece of this session I would not call done — a client that bypassed this
screen could message anyone, and nothing today stops it.

**A small, real regression against an already-disclosed bundle overage.**
§12 was 0.7 kB over (500.7 kB gz) before this session. Adding a new icon to
`@pam/ui`'s barrel and using it on Home cost about 0.2 kB; reverted in favour
of reusing the already-shared `PeopleIcon`. The remaining ~0.1 kB is the new
locale strings themselves — `useI18n` statically imports the whole bundle
into every route, so any new UI copy anywhere costs a few bytes on every
first load, not just the screen that shows it. Measured, not guessed: 500.7
kB → 500.8 kB gz. See D-151. The honest fix (splitting locale bundles) is out
of scope here; flagged rather than absorbed silently.

## Decisions

- **D-148** — messaging is scoped to accepted `connections`, enforced by the
  client today, not the database. The gap and the migration that would close
  it are both written out in full — read this one before touching
  `conversation_members_insert` or believing the scope is safe against a
  client that skips this screen.
- **D-149** — `conversations.last_message_at` is dead; the list derives
  recency and unread state from `messages` directly, and does not scale past
  a small message count per conversation.
- **D-150** — Messages does not honour the super-admin role-preview system;
  it always reads the account's real role, because there is no demo layer for
  it and previewing "Member" here would mean sending real messages as a real
  account.
- **D-151** — a ~0.1 kB bundle-budget regression from this session's new
  locale strings is disclosed and accepted; the ~0.2 kB from a new icon was
  found and reverted before it shipped.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | 5/5 packages clean |
| `pnpm --filter @pam/config test` | 211 passed, including dignity-language and en/es placeholder-parity checks against the new `messages.*`/`home.go.messages`/`nav.back.messages` keys |
| `pnpm --filter @pam/ui test` | 65 passed (unchanged — no `packages/ui` component behaviour touched, only an icon added then reverted) |
| `pnpm --filter @pam/web build` | succeeds, static export, 24 routes including the two new ones |
| `node scripts/check-bundle-budget.mjs` | 500.8 kB gz — over budget by 0.8 kB (was 0.7 kB; see D-151). `/messages` and `/messages/thread` each carry ~6.3 kB of their own route code, not counted against the shared-chunk budget this script measures, since nothing else in the app imports from them |
| Playwright, full suite, all 3 viewport/theme projects (`PLAYWRIGHT_CHROMIUM_PATH` pointed at the sandbox's installed 1194 build, since 1243 was not pre-installed here) | 426 passed, 0 failed — unchanged from the last session's own count, confirming this session's changes did not regress the existing signed-out/a11y coverage. No new Playwright spec was added for `/messages/` itself: those screens are signed-in-only and the existing suite has no session-fixture pattern for a real signed-in member to extend from |
| `pnpm --filter @pam/db test` | **not run** — this sandbox is missing the `postgis` extension (`packages/db`'s own README already names `postgresql-16-postgis-3` as a requirement). No `packages/db` file was touched this session, so nothing here should have moved, but this was not independently confirmed by the suite itself |

## Left undone

- **D-148's gap.** `conversation_members_insert`/`conversations_insert_participant`
  do not themselves check for an accepted connection. A follow-up migration
  should add that check at the database layer, the same way
  `messages_insert_sender` already gates on `in_conversation`.
- **No way to become connected.** `useConnectablePeople` reads `connections`
  where `status = 'accepted'`, but nothing in `apps/web` writes a `connections`
  row — mentor discovery and buddy requests are their own unbuilt screens.
  Today this list is empty for every real member until a connection exists by
  some other means (seeded data, or a future feature). The messaging UI itself
  is complete and correct against whatever `connections` rows exist; producing
  those rows is not this session's scope.
- **No reporting affordance in the thread view.** `report_message()` (0034)
  is fully built and correct at the database layer, but nothing in this
  session's UI calls it — there is no "report this message" action on a
  bubble. Given D-074's whole premise is that the report is the *only* route
  a case manager ever has into message content, a chat surface with no way to
  file one is a real gap for this population, not a nice-to-have. Recommend a
  follow-up session wire a small per-message action to it.
- **`conversations.last_message_at` still writes nothing.** D-149 documents
  the workaround; the honest fix is a trigger, left undone.
- **No Playwright coverage for the new screens.** See the Verified row above.
- **The §12 budget regression (D-151)** is disclosed, not fixed.

## Needs a human

- **D-148, explicitly**: is client-side connection-scoping (with the
  documented DB gap) an acceptable interim state, or should this wait for the
  enforcing migration before real members can reach it? I made the
  conservative call to ship the UI now with the gap fully written up rather
  than block on a migration, per this task's own instruction to prefer
  narrower scope and flag rather than block — but the honest answer is that
  today a compromised or modified client could message any member, and only
  this screen's own restraint prevents it in the stock build.
- **Message reporting has no UI.** Worth a decision on priority, not just
  scope — see "Left undone" above.
- **Who a member can message at all is still mostly theoretical** until
  mentor discovery or buddy requests exist. Worth sequencing against this
  work rather than after it, since the messaging screens are otherwise ready
  to use the moment connections exist.
