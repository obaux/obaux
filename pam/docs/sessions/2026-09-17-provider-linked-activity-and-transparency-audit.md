# 2026-09-17 — Provider-linked activity closed app-wide, transparency screen re-audited

**Phase:** 1 (privacy follow-up, widening the previous same-day fix) · **Sessions so far:** 28

> **Renumbering note, added during a same-day merge with a concurrent PAM
> session (D-170):** this log's migration numbers (`0054`–`0056`) and
> decision numbers (D-148 through D-158) were this session's own at the
> time of writing. A later merge found a concurrent session had
> independently used the same numbers for unrelated work, so this
> session's were renamed `0054`→`0060`, `0055`→`0061`, `0056`→`0062`, and
> D-148→D-159 through D-158→D-169. **The numbers below have been updated
> to match** — this log otherwise reads exactly as originally written.

## What changed

Will confirmed and widened D-165's closing note: "program admins don't see
activity, across entire app" is a blanket product rule, not something
scoped to messaging. Two pieces of work followed directly from that.

**1. Closed the pre-existing gap D-165 had found and deliberately left
open.** `profiles_select_provider_linked` (migration 0007, predating any of
today's messaging work) was a raw row policy granting a program admin the
whole `profiles` row — `last_active_at` and `phone` included — for any
member reached through an enrollment, an appointment, or a connection, with
no conversation required. Migration 0062 drops it and adds
`provider_linked_members()`, following the exact pattern
`conversation_partners()` (0061) and `directory_people()` (0043) before it
already established: a `SECURITY DEFINER` function, a fixed two-column list
(`id`, `first_name`), the guard inside the function body. `phone` was
dropped in the same pass rather than left for a third round on the same
shape of gap, per instruction.

Grepped `apps/web` for every place a provider reads `profiles` for a linked
member, not just the messaging code already touched: `useMessageableMembers.ts`
is the only real one (`/interested/` still renders dummy data only; nothing
else queries `enrollments`/`appointments`). That hook now takes the
caller's role explicitly and branches — a case manager keeps
`useCaseload`'s original broad-then-narrow query, unaffected; a program
admin now calls `provider_linked_members()`.

**Updated the `@pam/db` test suite to match, since it cannot run here.**
`02_rls_test.sql`'s "Providers reach members only through a link" block
used to assert a linked provider's direct `profiles` read returned one row
— now the wrong expectation, rewritten to assert the opposite and to
exercise `provider_linked_members()` instead. `04_rpc_test.sql` gained a
new block mirroring `directory_people()`'s own coverage: role gating, the
linked/unlinked distinction, and two `undefined_column` checks
(`last_active_at`, `phone`) proving the column list is actually short, not
just documented as short.

**2. Re-audited `packages/config/transparency.ts` line by line**, as
explicitly instructed, rather than amending it a fourth time in one day:

- Added, stated plainly and positively rather than left as a silent
  absence: *"A program never sees the last day you used PAM"* (new
  `cannotSee` line, plus the matching `ADMIN_CANNOT_SEE` entry). "A
  program" is ordinary member-facing vocabulary already used on this same
  screen (`canSee.enrollments`) and on Home (`role.provider` reads
  "Program"), not a staff title §9 forbids naming — it's the one line on
  the whole screen where a case manager's and a program admin's visibility
  genuinely diverge, so it's the one place naming the second role plainly
  was necessary.
- Re-verified D-164's `canSee.directMessages` line is still accurate: it
  describes message *content* visibility, which today's two migrations
  never touched (they closed a profile-*metadata* leak, a different
  thing). Confirmed unchanged and still true.
- Found and removed `canSee.chatMetadata` ("That a chat exists, and the
  last day you used it") and its `ADMIN_CAN_SEE` counterpart. Checked every
  migration in the repository, before and after any of today's three
  sessions: no policy has ever existed on `conversations` or
  `conversation_members` granting this. It predates all of today's work;
  fixed while already re-checking every line, not left for a fourth
  reader to find.
- Corrected the file's own top-of-file comment, which claimed an
  `admin_visibility.test.ts` enforces `ADMIN_CAN_SEE` against live RLS.
  D-164 had already found this file does not exist anywhere in the repo;
  that correction now lives in the file itself, not only in `DECISIONS.md`.
- Checked every remaining line against a real policy or code path:
  `goals`/`enrollments`/`appointments`/`points` all map to a real
  `admin_covers(member_id)` policy (verified directly in `0007_rls.sql`);
  `active_connections_names_and_kind` maps to `connections_select_admin`;
  `flagged_messages_routed_through_reports` maps to `report_message()`
  (0034). Left unchanged.

## What was wrong, and what missed it

**`canSee.chatMetadata` had been inaccurate since before any of today's
three messaging sessions, and nothing in three consecutive same-day passes
over the same file had caught it until asked to check every line
specifically.** Two earlier sessions today edited this file — once to add
`directMessages`, once to rework `cannotSee.messages` — and neither pass
noticed the neighbouring `chatMetadata` line described a capability that
does not exist. `pnpm --filter @pam/config test` cannot catch this: it
checks the copy is internally consistent (matches its own English source,
has a Spanish translation, contains no forbidden terms) — it has no way to
know whether a line is *true* against the actual RLS policy set, which is
exactly the gap `admin_visibility.test.ts` was apparently meant to close
and never was. Worth restating for whoever reads this next: a promise that
passes every test that exists can still be false, if none of those tests
check the promise against the thing it claims to describe.

## Decisions

- **D-166** — `provider_linked_members()` (0062), closing the app-wide
  activity-info gap D-165 had flagged and left open, and the new
  `02`/`04` test coverage written for it (unverified by an actual run —
  see below).
- **D-167** — the transparency-screen re-audit: what was added
  (`programActivity`), what was verified unchanged (`directMessages`),
  what was found and removed (`chatMetadata`), and the in-file correction
  about `admin_visibility.test.ts` not existing.
- **D-165**'s closing note marked resolved, pointing to D-166.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | 5/5 packages clean |
| `pnpm --filter @pam/config test` | 211 passed — the transparency word-for-word test and en/es key-parity test both pass against the rewritten copy (one key removed, two added, net count unchanged from the previous session) |
| `pnpm --filter @pam/ui test` | 65 passed, unaffected |
| `pnpm --filter @pam/web build` | succeeds, static export |
| `node scripts/check-bundle-budget.mjs` | 501.0 kB gz, unchanged from the previous session (one locale line removed, two added — roughly a wash) |
| Playwright, full suite (`a11y.spec.ts` + `join.spec.ts`, the one spec with a literal assertion on this screen's text) | 426 passed, 0 failed. Grepped for any assertion on the removed `chatMetadata` text or the new `programActivity` line first and found none, so no other spec needed updating |
| `pnpm --filter @pam/db test` | **still not run** — this sandbox is missing `postgis`. This is now three consecutive same-day migrations (0060 superseded, 0061, 0062) and two hand-written new test blocks that have never executed against a real database |

## Left undone

- **`pnpm --filter @pam/db test` against 0060/0061/0062** and the new
  `02_rls_test.sql`/`04_rpc_test.sql` blocks written for 0062 — all
  unverified by an actual run. Read them directly before trusting any of
  it against the live project.
- **`admin_visibility.test.ts` still does not exist.** Today's three
  migrations were cross-checked against `transparency.ts` by hand, three
  times in one day. A real test that diffs `ADMIN_CAN_SEE` against the
  live policy set automatically is real, worthwhile follow-up work that
  keeps not happening by hand-checking instead.
- Every item already left undone by the three earlier sessions today
  (D-163's RLS enforcement gap for who may *start* a conversation, no
  message-reporting UI, the Home icon duplication for staff,
  `profiles_select_admin_caseload`'s own `phone` exposure to case
  managers, which nothing today touched since every instruction was
  explicitly provider-role-specific) is unchanged by this one.

## Needs a human

- **Run `pnpm --filter @pam/db test` against 0060, 0061 and 0062**, and the
  new hand-written test blocks, on a machine with `postgis`, before any of
  this reaches the live project.
- **Whether `admin_visibility.test.ts` is worth building now**, given this
  is the second time in one day a stale line in `transparency.ts` was
  caught by instruction rather than by an automated check.
