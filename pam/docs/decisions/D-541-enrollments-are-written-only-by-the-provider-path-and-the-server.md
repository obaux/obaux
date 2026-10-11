# D-541 — Enrollments are written only by the provider path and the server

**Date:** 2026-10-11 · **Branch:** `claude/messages-program-before-booking`

**Decided by:** Mira, quoting Will (11 October): residents must be able to message programs before booking, so the door to a program's leads has to be one Pam opens, not one a member can open for themselves.

**Found:** `enrollments_own` was `for all` and anon/authenticated held INSERT, UPDATE and DELETE. `can_message()` links a program lead and a member through enrollments, so any member could insert an enrollment at any program's service and unlock messaging with its leads. `enrollments_update_provider` had `with check (true)`, so a lead could repoint a row. Neither was used (0 rows live).

**Decision:** members can only read their own enrollments. A lead may change `status`, `notes` and `updated_at` and only on a row at their own org's service. Everything else is written by the server. Done with REVOKE, a column GRANT and ALTER POLICY only (`enrollments_own` keeps its name, `using` for reads, `with check (false)`), no DROP (D-387).

**Why not a new policy set:** ALTER POLICY cannot change a policy's command, and a DROP is not available to the connector. The revoke is what actually closes the door; `with check (false)` is the second lock.

**Later:** if a member should ever enrol themselves, it is an RPC that checks the program, not a table grant. Test 64 proves it.
