# 2026-09-17 — Narrow conversation-partner visibility (no activity info)

**Phase:** 1 (privacy follow-up on the same day's staff-to-member messaging correction) · **Sessions so far:** 27

> **Renumbering note, added during a same-day merge with a concurrent PAM
> session (D-170):** this log's migration numbers (`0054`–`0056`) and
> decision numbers (D-148 through D-158) were this session's own at the
> time of writing. A later merge found a concurrent session had
> independently used the same numbers for unrelated work, so this
> session's were renamed `0054`→`0060`, `0055`→`0061`, `0056`→`0062`, and
> D-148→D-159 through D-158→D-169. **The numbers below have been updated
> to match** — this log otherwise reads exactly as originally written.

## What changed

Follow-up from Will, on top of the staff-to-member rescoping
(`docs/sessions/2026-09-17-messaging-is-staff-to-member-not-peer-to-peer.md`,
commit `0670aee`) and its new `profiles_select_conversation_partner` policy
(migration 0060): a program admin must not see a member's activity info
(`last_active_at`, and anything in that vein) through the messaging surface.

**Audited what 0060's policy actually granted**, as asked, rather than
assuming: a `for select using (...)` policy has no way to expose some
columns and not others. The moment it made a conversation partner's row
readable at all, every column came with it — `last_active_at`, `phone`,
`bio`, `tags`, `home_zip` — to *any* conversation partner, staff or member,
of any role. Not program-admin-specific; too blunt an instrument for what
was asked.

**Fixed by following 0043's own precedent**, as instructed: migration 0061
drops that policy and adds `conversation_partners()`, a `SECURITY DEFINER`
function returning exactly two columns — `first_name`, `role` — for whoever
shares a `conversation_members` row with the caller, guarded by
`mine.profile_id = auth.uid()` inside the function body (never a
caller-supplied id). Same shape as `directory_people()`: fixed column list,
guard inside the function, `execute` revoked from `anon`/`public`, granted
only to `authenticated`.

Chose a uniform two-column answer over a role-conditional one (Will's
message offered either "a role-gated function or column-scoped view" as
acceptable). Nothing in the messaging UI has ever shown activity info to
anyone of any role — verified by grepping `/messages/` and its hooks — so a
function that simply never returns `last_active_at` to *anybody* through
this path is both simpler and more restrictive than one that returns it to
case managers but not program admins. Case managers keep exactly the
activity visibility they already had, unchanged, because it comes from a
completely separate, untouched path (`admin_covers()`, `/admin/`'s "Your
people" screen, `useCaseload.ts`).

`apps/web/src/lib/useConversations.ts` and `useThread.ts` were rewritten to
call `conversation_partners()` instead of joining `profiles` directly.
`useConversations.ts`'s `one()` helper became dead code once its last caller
(the removed `profiles` join) was gone, and was deleted.

## What was wrong, and what missed it

**The exposure was introduced this same day, by me, in the previous
correction — not caught by that session's own verification, because nothing
in the test suite checks what columns a policy exposes, only whether a row
is readable at all.** `pnpm --filter @pam/config test` has no visibility
into `packages/db` policies; `pnpm --filter @pam/db test` — the one suite
that would plausibly catch a column-shaped over-grant — could not run in
this sandbox (missing `postgis`) either time. This was caught by a human
reading the actual policy and asking a specific, concrete question ("what
does this expose to a program admin"), not by any automated check. Worth
stating plainly for whoever reads this next: a row policy that "just makes
the name visible" is a claim that needs verifying against what the policy
literally grants, not against what the one query you wrote happens to
select.

**A second, pre-existing gap surfaced by the same audit, not fixed here.**
`profiles_select_provider_linked` (migration 0007, long before this
session) already grants a program admin the whole `profiles` row —
`last_active_at` and `phone` included — for any member linked through an
enrollment, appointment, or connection, independent of whether a
conversation exists. Narrowing the conversation-specific path does not
touch this older, wider one: a program admin can still read a member's
`last_active_at` today by querying `profiles` directly, for any member they
are enrolled with, whether or not they have ever messaged them. Flagged in
D-165's closing note and STATUS.md row 14 rather than silently left
implied-fixed by this session's narrower change.

## Decisions

- **D-165** — the corrected, uniform (not role-conditional)
  `conversation_partners()` function, the reasoning for choosing uniform
  over role-gated, and the pre-existing `profiles_select_provider_linked`
  gap this does not close.
- **D-164** — its first point (the raw `profiles` policy) marked superseded
  by D-165; its second point (the transparency contract change) unaffected
  and unchanged.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | 5/5 packages clean |
| `pnpm --filter @pam/config test` | 211 passed, unaffected — this change touches `packages/db` and `apps/web` only |
| `pnpm --filter @pam/ui test` | 65 passed, unaffected |
| `pnpm --filter @pam/web build` | succeeds, static export |
| `node scripts/check-bundle-budget.mjs` | unchanged from the previous session (no copy or UI changed, only a query's data source) |
| Playwright, full suite | not re-run this session — nothing user-visible changed (same screens, same copy, only which database function a hook calls); the copy-level changes that needed re-verification were already covered by the previous correction's run |
| `pnpm --filter @pam/db test` | **still not run** — this sandbox is missing `postgis`. This is now two consecutive same-day migrations (0060, superseded, and 0061, current) that have not been run through the RLS penetration suite |

## Left undone

- **`profiles_select_provider_linked`'s pre-existing, wider activity-info
  exposure** (D-165's closing note) — not touched. Fixing it properly would
  mean replacing a general-purpose, long-standing policy with a
  column-limited function, which affects every current and future feature
  built on a program admin's profile access to a linked member, not just
  messaging. Bigger than a same-day follow-up; Will's call on priority.
- **`0060`/`0061` still need `pnpm --filter @pam/db test`** on a machine
  with `postgis` before either should be trusted against the live project.
- Every item already left undone by the previous two sessions (D-163's RLS
  enforcement gap, no message-reporting UI, the Home icon duplication for
  staff) is unchanged by this one.

## Needs a human

- **Whether "program admins don't see activity info" needs to be true
  everywhere**, or just true of the messaging surface specifically — see
  D-165's closing note and STATUS.md row 14. The messaging-specific promise
  is now real; the general one is not, yet.
- **Run `pnpm --filter @pam/db test` against 0060 and 0061** on a machine
  with `postgis` before this reaches the live project.
