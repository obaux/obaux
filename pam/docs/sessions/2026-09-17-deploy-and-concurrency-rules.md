# 2026-09-17 — Deploying the messaging migrations live, and a concurrency rule

**Phase:** Phase 1 (member-facing product) · **Sessions so far:** many; this is
the fifth on messaging alone today

## What changed

Deployed `0055_conversation_partner_no_activity.sql` and
`0056_provider_linked_no_activity.sql` to the live Supabase project
(`shobqzuhicoiymtumiaz`). `0054` was superseded before this point and was not
deployed on its own. Ran `mcp__Supabase__get_advisors` (security) afterward,
per `CLAUDE.md`'s own instruction — clean; every finding is the same
"SECURITY DEFINER is PostgREST-exposed" class already produced by every other
RPC in this project by design.

Added a "Working alongside another PAM session" section to `pam/CLAUDE.md`.

## What was wrong, and what missed it

Before deploying, `mcp__Supabase__list_migrations` was checked against
`packages/db/migrations/` — a step this session did on its own initiative,
not because anything before it had failed. It surfaced real drift:

- Six migrations exist on the live project with no matching file anywhere in
  this repo, on any branch: `staff_review`, `staff_denied_sms`,
  `program_submission`, `demo_view`, `lock_notify_on_staff_request`,
  `staff_requests_indexes`, all applied 17 September. Names match the
  `staff_requests` review flow `STATUS.md` still lists as unbuilt. Nothing in
  this repo's git history produced them — almost certainly Will's other,
  concurrent session, working directly against the live database without
  committing the migration files.
- `0052_saved_places_say_what_they_are.sql` is committed to this repo but does
  not appear in the live migration list at all.

Nothing caught this automatically — there is no check that compares the
local migration ledger to the live one, and none of today's four earlier
messaging sessions looked. Had this session not checked before deploying, it
would have applied `0054`–`0056` into a live schema whose actual state its
own repo could not fully explain, with no way to know whether the six
unknown migrations touched anything overlapping.

They didn't, on inspection — `0054`–`0056` only create/drop
`profiles_select_conversation_partner`, `profiles_select_provider_linked`,
`conversation_partners()`, and `provider_linked_members()`, none of which a
`staff_requests` review flow plausibly touches — so deployment proceeded.
Both gaps (the six undocumented migrations, and `0052`'s absence) are left
exactly as found for Will to explain or reconcile; guessing at another
session's in-flight work seemed worse than asking.

## Decisions

- D-158 — migrations 0054–0056 deployed live; the drift found and left for
  Will, and the new concurrency section in `CLAUDE.md`, explained in full.

## Verified

| Check | Result |
|---|---|
| `mcp__Supabase__list_migrations` vs `packages/db/migrations/` | Drift found: 6 live-only, 1 local-only (see above) |
| `mcp__Supabase__apply_migration` × 3 (0054, 0055, 0056, in order) | All succeeded |
| `mcp__Supabase__get_advisors` (security) | Clean — no findings specific to this session's migrations, only the pre-existing "SECURITY DEFINER is PostgREST-exposed" class every RPC in this project already has by design |

No code changed this session — this was deploy + documentation only. The
221-check local `@pam/db test` result from the previous session (D-157)
still stands and was not re-run against the live project (there is no tool
in this session's kit to run the local suite against a remote database).

## Left undone

- The six undocumented live migrations are not explained or reconciled.
- `0052`'s absence from the live project is not explained or reconciled.
- The live RLS fingerprint (`STATUS.md`, "What is proven") has not been
  re-computed since `0054`–`0056` deployed; the old "identical to local"
  claim predates today and is now marked as such rather than repeated.
- Everything already left undone by the four earlier messaging sessions today
  (D-152 through D-157) is still undone: who may *start* a conversation is a
  UI restraint, not an RLS one; `profiles.phone` is still exposed to a case
  manager's own caseload (row 15); there's no "report this message"
  affordance in the thread view yet.

## Needs a human

- Explain or reconcile the six live-only migrations and the missing `0052` —
  ideally by committing the six migration files retroactively from whichever
  session applied them, and confirming whether `0052` was held back on
  purpose or simply missed.
- Decide whether to re-run a live RLS fingerprint check now that the two
  sessions' schemas need reconciling anyway.
