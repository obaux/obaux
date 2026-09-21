# 2026-09-21 — Messages tidied, reported things where they belong, places search

**Phase:** 1 (member-facing product) · **Sessions so far:** the sixth on
messaging; branch `claude/pam-messenger-2` off `main` at `2651d81`
(`0052`/`0063`–`0065` live)

## What changed

Six asks from Will, testing the live URL as super admin. One migration,
**not applied to the live project** (Will deploys after review):

- `packages/db/migrations/0066_search_flags_and_program_names.sql` —
  `pg_trgm` in `extensions`; `services_search()` (typo-tolerant name /
  lookup name / address search, `security invoker`); `flagged_services()`
  (open flags joined to their places, for `is_admin()`/`is_super_admin()`
  only); `conversation_partners()` gains `program_name` (a provider's
  `orgs.name`) — dropped and recreated since the return type changed.
- `packages/db/test/06_search_and_flags_test.sql` (new) — typo search
  finds the place and not an unrelated one, blank query returns nothing,
  the unreviewed row never surfaces; flagged places visible to a case
  manager and a super admin and to no member, cleared by a decision;
  `program_name` present for a provider partner, absent for a case
  manager, and still no activity/contact columns.

**Web:**

1. Reported messages: `DUMMY_REPORTS` example set; the Reported section of
   `/messages/` (D-184). The real path (`report_message()` →
   `notify_on_report` → `reports_for_review()`) was already covered by
   `03_invariants.sql` + `05_messenger_test.sql`; nothing was missing for
   real, so no migration for it.
2. `/reports/` route and Home tile removed; Reported is a `SegmentedControl`
   section of `/messages/` (case manager: both; super admin: Reported only).
   `?show=reported` deep link. Bell rows link to their subject (D-185) —
   `NotificationList` gained an optional `href`.
3. `ConversationRow` — Astryx `ListItem` rows, 48px/18px, invisible-anchor
   pattern (D-186); shared by real and example lists.
4. Context line under the name, in the list and in the thread title
   (D-187): "Case manager" / program name for a member, nothing for staff
   looking at a member. `useConversations`/`useThread` carry
   `otherProgramName`.
5. "Start a conversation" list and `StartConversationRow` removed;
   `NewMessagePicker` (BottomSheet + TextInput + List) behind one
   `BigButton` (D-186); example cast via `dummyPickerFor`.
6. `/places/` search box → `services_search` after a 300 ms debounce, with
   "Nothing matched that" copy (D-188). `usePlaces` takes `query`.
7. `/places/` "Reported" chip for reviewers, `?filter=reported`,
   `ReportedPlaces` (lazy) on `PlaceCard` with a flag badge and, for a real
   super admin, Keep / Take it off the list via `resolve_service_flag()`;
   `DUMMY_FLAGS` for previews (D-189). No reviewer screen existed before —
   nothing to fold in.

Locale keys added for the sections, the picker, the search and the
reported places; `home.go.reports` and `reports.notAllowed/signedOut`
removed. Decisions: D-184 through D-189.

**Same day, later (branch `claude/pam-thread-layout`, D-192–D-194, A13,
A14):** the thread screen on a phone. `ThreadFrame` + `ThreadHeader`
(`apps/web/src/app/messages/ThreadFrame.tsx`): a `100dvh` flex column with
the app header and a one-row thread header pinned, `ChatLayout` owning the
scroll and docking the composer as a sticky flex item; the D-187 context
moved from a subtitle to a `Token` beside the name. Send/mic/Report are
48px squares (`ChatSendButton`/`ChatDictationButton` `size="md"` + a
square `xstyle`; Report is `Button isIconOnly` with the `warning` icon);
composer `density="compact"`, no wrapper around the input. The help bar
is gone from the thread (A14); the route's not-found/error states keep
their notices. `messages.spec.ts` gained a pinned-layout test (30 messages
at iPhone SE: `scrollY` stays 0, header and send boxes unchanged, last
message above the composer), a 48px sweep of every control on the thread,
a send-is-48×48 check, a tag-beside-name check and a no-help-link check.
One stumble: `pam` (`@pam/ui`'s `defineVars`) cannot be imported into
`apps/web` — StyleX resolves `defineVars` only from a `.stylex.ts` path,
and the barrel re-export breaks the build — so `ThreadFrame` writes the
three numbers out (560/16/48) with a comment saying where they come from.

## What was wrong, and what missed it

**`services_search` first used `s.*` and died with "permission denied for
table services".** `services` is granted column by column (0016 revoked
table-wide select; 0050 grants named columns), so a `*` inside a
`security invoker` function trips on the columns nobody may read.
`services_near` never had the problem because it names its columns. The
DB suite caught it on the first run; the fix is the same explicit list.

**The test file's own search fixture used the seed's services, which
`03_invariants.sql` had flagged, removed and restored by then.** The first
"an exact word finds the place" failed against a row that was no longer
`is_active`. Fixture rows of the file's own, inserted as `postgres`, fixed
it — the same lesson as the 20th (earlier files own the seed's state by
the time a later file runs).

**`.next/types` still remembered the deleted `/reports/` route** and failed
typecheck until the directory was removed. Harmless but confusing: the
error names a file that does not exist.

## Decisions

- D-184 — Reported messages inside Messages; example reports; real path
  already proven.
- D-185 — bell rows link to their subject (partly reverses D-080).
- D-186 — conversation rows are `ListItem`s; "New message" is a sheet
  picker with search; `Typeahead` set aside.
- D-187 — context line under the name; nothing under a member's.
- D-188 — places search via `pg_trgm` server-side, because the client
  never holds the whole list.
- D-189 — reported places are a Places filter for reviewers; decision on
  the card for a super admin.
- D-192 — the thread is a pinned frame; send is a 48px square (A13).
- D-193 — one-row thread header with a Token beside the name.
- D-194 — no help link on the conversation (A14).

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | 5/5 |
| `pnpm --filter @pam/config test` | 225 pass |
| `pnpm --filter @pam/ui test` | 65 pass |
| `pnpm --filter @pam/db test` | **286 checks pass, 0 failures** (was 272) — `0001`–`0066` plus `06_search_and_flags_test.sql` |
| `pnpm --filter @pam/web build` | static export; `/reports/` gone |
| `node scripts/check-bundle-budget.mjs` | 504.8 kB gz on `/` (was 504.6; +0.2 kB, locale strings net of the removed tile). Shared first load unchanged at 349 kB. `/messages` 503 kB, `/places` 504 kB first load; the picker, reported places and example data are all lazy chunks |
| Playwright (full suite, `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`) | **471 pass, 0 failures** before the thread-layout pass; **474 pass, 0 failures after it** (one more test × 3 projects; `scripts/journeys.mjs` now photographs the thread as `6b-conversation` for every role) — 456 from before plus 5 new tests × 3 projects (picker, Reported section, super admin view, bell deep link, reported places) in `messages.spec.ts` and 2 × 3 in `places.spec.ts`, minus the 2 removed `/reports/` tests |

## Left undone

- **Deploy `0066`** (Will). Until then `/places/` search, the Reported chip
  and the program name under a program admin call RPCs/columns that do not
  exist live — the search box will show "Nothing matched that" on error.
- The Reported places list is not ordered by distance (no origin); newest
  flag first.
- §12 still over: 504.8 kB.

## Needs a human

- Deploy `0066`, then `get_advisors`.
- D-189 gives a case manager the Reported list read-only; if Will wants
  case managers to decide flags too, `resolve_service_flag()` (0036) is
  super-admin-only and would need its own change.
