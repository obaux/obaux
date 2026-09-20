# 2026-09-20 — The messenger, finished

**Phase:** 1 (member-facing product) · **Sessions so far:** the fifth on
messaging (after D-163 through D-171 on the 17th and D-172 through D-175
on the same day's preview branch)

## What changed

Will's scoped brief for an in-app messenger, mapped to what already existed
from the 17th and built as a completion pass. Branch `claude/pam-messenger`,
off `main` at `0ebedd9`.

**Three migrations, none applied to the live project** (Will deploys after
review, per `pam/CLAUDE.md`'s `list_migrations` check):

- `packages/db/migrations/0063_messaging_relationships.sql` — `can_message()`,
  `messageable_people()`, `open_direct_conversation()`; drops the two insert
  policies on `conversations`/`conversation_members`. Who may open a
  conversation is a database rule now (D-176), and D-171 (a super admin
  cannot) is enforced there too. Closes the RLS gap D-163 flagged, plus a
  worse one found reading the policy: `profile_id = auth.uid()` let any
  account join any conversation whose id it learned.
- `0064_message_notifications.sql` — `message_received` notifications via a
  `notify_on_message()` trigger, recipient-only, first name only, no body,
  no SMS (D-182).
- `0065_reports_visibility.sql` — replaces `reports_admin_review`
  (`is_admin()`, every region, no super admin) with
  `report_visible_to_me()` (every super admin, plus the active case manager
  of the sender or reporter) and adds `reports_for_review()` for the
  moderation screen (D-178).

**Tests:** `packages/db/test/05_messenger_test.sql` (new; the runner's glob
widened from `0[234]_` to `0[2-9]_`), covering forbidden and allowed pairs
both directions, the closed direct routes, the listing function per role,
the bell row, the untouched SMS queue, and the report audience.
`apps/web/e2e/messages.spec.ts` (new): the list with previews, the thread
as a chat log, sending, reporting, the example thread sending nowhere, and
`/reports/` — with axe on each screen.

**Web:**

- `apps/web/src/app/messages/ThreadView.tsx` (+ `ThreadViewLazy`) — the
  thread drawn with `@astryxdesign/core/Chat` (D-181); the hand-rolled
  `MessageBubble` is gone. Report action and reason picker live here (D-177).
- `apps/web/src/app/messages/DemoThread.tsx` (+ lazy) — example threads for
  a role preview, through the same `ThreadView` (D-180).
  `packages/config/src/dummy-conversations.ts` gained `DUMMY_THREADS` and a
  member "start" list; `demoMessages.ts` gained a per-conversation store.
- `apps/web/src/app/messages/page.tsx` — last-message preview per row
  (D-179); "Start a conversation" for members too; one `messageable_people()`
  list for all roles. `useMessageableMembers`, `useConversations`,
  `openConversation` rewritten accordingly.
- `apps/web/src/app/reports/page.tsx` (new) + `useReports.ts` — reported
  messages only (D-178); a Home tile for case managers and super admins.
- `apps/web/src/app/UnreadMessages.tsx` (+ lazy) and `NavTile`'s new
  `count` prop — the unread count on the Messages tile (D-182).
- `reportMessage.ts`, `MESSAGE_REPORT_REASONS` in `@pam/config`, 35 new
  locale keys in en and es.

Decisions: D-176 through D-182.

## What was wrong, and what missed it

**The Home tile's count cost 3.2 kB the first time.** Calling
`useConversations` from Home pulled the conversation list's machinery into
the first load; `check-bundle-budget.mjs` caught it (506.2 kB). A hook cannot
be lazy-loaded, but a headless component can — `UnreadMessages` runs the
hook behind `next/dynamic` and reports the number up. 504.7 kB after, the
remaining +1.1 kB over the 17th being the locale strings and `Badge`.

**`report_visible_to_me()` was revoked from `authenticated`, and every
policy that called it failed.** A policy runs as the caller, so the helper
needs `execute` for `authenticated` the way `is_super_admin()` (0033) has —
the DB suite caught it on the first run ("permission denied for function")
before it could reach a real project.

**`set local role postgres` outside a transaction is a no-op.** The test
file's fixture and its SMS-queue check both did nothing until it became
`reset role`; the queue check then failed honestly (RLS was still on) and
was worth the lesson. Other test files only "work" because they are already
`postgres` when they say it.

**Counts in the messenger test file assumed a clean fixture.** Earlier
files in the suite redeem an invite onto Dana's caseload, seed a
conversation between Dana and Marcus, and file more than one report — so
three exact-count checks were rewritten as membership and delta checks.
Same class as the 17th's hardcoded message count.

**The 17th's program badge (D-175) had broken 12 admin.spec checks, and
nobody could see it.** `useCaseload` gained an `enrollments` query on the
17th, in a sandbox that could not run Playwright; every `admin.spec.ts`
test that renders a real caseload hung on the unstubbed request. First full
run today: 12 failed. The fix is a one-line stub in the spec's `signedInAs`
(`ENROLLMENTS` → `[]`), and the lesson is the one the 17th's log already
wrote down: a session that cannot run a check should say which screens it
touched that the check covers, so the next one runs them first.

## Decisions

- D-176 — who may open a conversation is a database rule; members may
  message their own staff (supersedes "a member starts nothing" in D-163).
- D-177 — report from the thread, fixed-list reason, other side's messages only.
- D-178 — `/reports/` shows reported messages to D-074's audience; the
  policy narrowed to match, reporter's case manager included (flagged for
  Will to narrow further if he disagrees). No contract change.
- D-179 — last-message preview from the existing read.
- D-180 — example threads through the real thread component.
- D-181 — Astryx Chat on the thread route only.
- D-182 — unread count on the tile (a number, for once) and a bell row per
  message, never a text.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | 5/5 |
| `pnpm --filter @pam/config test` | 225 pass (key-for-key en/es, dignity rules) |
| `pnpm --filter @pam/ui test` | 65 pass |
| `pnpm --filter @pam/db test` | **272 checks pass, 0 failures** (was 235) — migrations `0001`–`0065` plus the new `05_messenger_test.sql` |
| `pnpm --filter @pam/web build` | 25 routes + `/reports/`, static export |
| `node scripts/check-bundle-budget.mjs` | 504.7 kB gz on `/` (was 503.6; +1.1 kB, locale strings + `Badge`). Shared first load unchanged at 349 kB. The Chat chunk (217 kB raw) is in no route's first load; `/messages/thread` first load 497 kB |
| Playwright a11y (full suite, `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`) | **450 pass, 0 failures** — 426 from before plus the 24 (8 × 3 projects) in the new `e2e/messages.spec.ts`; axe clean on the thread, the example thread and `/reports/` at 320px, dark and iPhone SE |

## Left undone

- **Migrations `0063`–`0065` are local only.** Not applied to the live
  project on purpose; Will deploys after review, after
  `mcp__Supabase__list_migrations` and `get_advisors`. `0052` still
  undeployed as before.
- **Resolving a report** — `reports.resolved_at`/`resolution` exist, nothing
  writes them (D-178 says why).
- **The 04_rpc_test "case manager cannot read messages" ordering note** in
  `04_transparency_contract_test.sql` now also applies to
  `05_messenger_test.sql`; both run after it by name.
- **`/interested/`** still dummy, untouched, per the brief.
- **§12** still over: 504.7 kB.

## Needs a human

- Deploy `0063`, `0064`, `0065` (Will).
- D-178's audience: the reporter's case manager is included as well as the
  sender's. Say if that should narrow to the sender's only.
