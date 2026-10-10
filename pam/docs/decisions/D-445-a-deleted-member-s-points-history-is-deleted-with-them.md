# D-445 — A deleted member's points history is deleted with them

**Date:** 2026-10-10 · **Branch:** `claude/affectionate-goldberg-tvu4sz`

Will, 10 October 2026, asked whether deleting a member should also delete their
points history: "Yes, Deleting a member should delete their points history." (He had
been told that a member with points could not be deleted at all: D-443, "Not done".)

## What was wrong

`points_ledger.member_id` references `profiles` `on delete cascade`, and the ledger is
append-only — a trigger refuses every UPDATE and DELETE, the service key included, so
that nobody can rewrite what a member has earned. The trigger therefore refused the
cascade too, and with it the deletion of any member who had ever earned a point.
Probed on the seeded data on 10 October: the one member with points was blocked; the
admins and providers were not.

## What was decided and built

`20261010033917_points_history_is_deleted_with_the_member.sql` (not yet applied):

- The shared guard `reject_mutation()` lets a DELETE on `points_ledger` through **when
  the member's account is already gone** — which is the state inside the cascade from
  deleting the profile. While the profile exists the guard refuses, for the database
  owner and the service key alike; an UPDATE is always refused; the audit-log exception
  from D-443 is untouched.
- "Is the account gone" is asked through `profile_still_exists(uuid)`, a SECURITY
  DEFINER function, because `profiles` **forces row-level security** (found by the
  first draft of the test, which asserted it did not): read as the caller, a role whose
  policies hide the row would be told "gone" and could delete a living member's
  history. No client role can call it; `service_role` can, so its refused attempt says
  "append-only" instead of "permission denied".
- The guard keeps the pinned search path (the previous migration put it back), and the
  points branch is nested inside its own `if`: the first draft read `old.member_id` on
  the audit log's rows too ("record old has no field member_id") because plpgsql does
  not promise to stop reading an `and` at the first false.

Verified: DB suite 655 checks, 16 new in `23_points_deleted_with_member_test.sql`: a
living member's points cannot be deleted or changed by the owner or the service key;
deleting the member deletes their points; other members' points, and the seeded
member's, are untouched; the audit log still refuses the owner; clients cannot call the
helper.

## Not done

- **Not applied, not merged** (Will said yes to the rule, not yet to applying this
  migration). Apply it with `list_migrations` first; it contains no `drop`.
- Still no single routine for the Pam team that deletes everything (profile, email,
  invites, messages, photos, points) in one tested call; with this and D-443 the plain
  delete of an account now works for everything the test data covers, but only a real
  member with real messages, photos and documents would prove it (storage objects are
  not rows in these tables and are not removed by a cascade).
