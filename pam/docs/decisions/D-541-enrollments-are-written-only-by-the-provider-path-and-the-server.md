# D-541 — Enrollments are written only by the provider path and the server

**Date:** 2026-10-11 · **Branch:** `claude/messages-program-before-booking`

**Decided by:** Mira, quoting Will (11 October): residents must be able to message programs before booking, so the door to a program's leads has to be one Pam opens, not one a member can open for themselves.

**Found:** `enrollments_own` was `for all` and anon/authenticated held INSERT, UPDATE and DELETE. `can_message()` links a program lead and a member through enrollments, so any member could insert an enrollment at any program's service and unlock messaging with its leads. `enrollments_update_provider` had `with check (true)`, so a lead could repoint a row. Neither was used (0 rows live).

**Decision:** members can only read their own enrollments. A lead may change `status`, `notes` and `updated_at` and only on a row at their own org's service. Everything else is written by the server. Done with REVOKE, a column GRANT and ALTER POLICY only (`enrollments_own` keeps its name, `using` for reads, `with check (false)`), no DROP (D-387).

**Why not a new policy set:** ALTER POLICY cannot change a policy's command, and a DROP is not available to the connector. The revoke is what actually closes the door; `with check (false)` is the second lock.

**Later:** if a member should ever enrol themselves, it is an RPC that checks the program, not a table grant. Test 64 proves it.

## Part 2 — message a program before booking

**Decided by:** Will, 11 October: "It's important that residents can message programs even before booking a visit."

- `message_program(service)` opens or reuses a conversation between the member and **one** lead of the place's organisation. A conversation is two people (members, unread counts, blocks and notifications are all per pair); a group would put every colleague's name in front of someone who wrote to "a program" and would let one block silence one of several. The lead is the one the member already talks to, else the longest-standing active lead; if that lead is suspended or blocks the member, the next message opens one with the next lead. A place with no organisation, or no active lead, raises `NO_PROGRAM_LEAD`, and the place page shows Call / Website instead.
- Only a member acting as a member starts it. A lead replies through the ordinary message policy.
- **Who may open a new conversation** is `can_start_conversation()`: `can_message()` plus a program lead and a member with a non-cancelled visit at the lead's org, or who has already written to them. `can_message()` itself is unchanged because `people_activity()` and the caseload use it to decide what a person may learn about someone: a lead who only received a message sees a first name and the words, nothing more (`conversation_partners` as it is).
- The place page's Message row and menu item go to `/messages/thread/?program=<place>`; the thread screen calls the RPC and replaces the address with the conversation's. No lead on Pam, no row.
- D-511: a member who has written has a conversation, so the Messages tab shows.
