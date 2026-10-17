# D-599 — the audit purge also removes rows that name an erased person only in meta

**Date:** 2026-10-17 · **Branch:** `claude/messages-audit-meta-purge`

**Decided by:** Mira, relaying Lena's sweep, 17 October 2026. Will's rule (D-443, 10 October): an erased account stays in the audit log for six months, then goes. `privacy.s.how-long.p3` tells people so in seven languages.

**What was wrong:** `purge_erased_audit()` deleted a row only when the erased person was its `actor_id` or `target_id`. A row that names them only in `meta` stayed past the six months. Three writers do that: `open_direct_conversation` (`conversation.open`, meta `with`) and `message_program` (meta `lead`/`with`, the program lead), both D-541 in `20261011203917`; and `record_account_deletion` (meta `by`, the admin who deleted someone). Such rows are already in the live audit log.

**What changed:** migration `20261017075451`. The purge now also deletes a row when any **top-level** value of its `meta` equals the erased profile's id. Kept exactly: security definer, `search_path = public, extensions`, the transaction-local flag, no grant to a client role, the six-month clock from the `account.delete` row. The append-only guard is untouched; its one exception (a DELETE made by this function) already covers it. A `meta` that is not an object is skipped, not an error.

**Why the writers were left alone:** the live rows exist already, so the purge has to cover them either way, and the ids in `meta` are what make the audit trail useful (who was opened with, who deleted whom). Changing the writers would only hide the same fact from future rows.

**Not covered, on purpose:** an id nested deeper than the top level of `meta`, or inside an array. No writer puts one there; the next writer that does must either use a top-level key or extend the purge. A new test (77) would catch a regression of the top-level case only.

**Piper's a94 booking row** puts the member in `target_id`, so it was covered before and is now.

**Proof:** test 77. A member erased more than six months ago and named only in meta (`with`, `lead`) is purged along with their deletion row; someone else's rows stay (a row naming a different person, another meta value, a `meta` that is an array); someone erased today is not purged. On main (without the migration) it fails: the purge removes 1 row, not 3. Full database suite passes.

**Applying:** Mira, after the batch's CI, `list_migrations` first. It is a function replacement; running it again changes nothing. The first nightly run after it removes the older rows that were being kept.
