# D-567 — A new phone number moves an account, after a person at Pam checks it

**Date:** 2026-10-13 · **Branch:** `claude/pam-new-number`

**Decided by:** Will, card a73 (the request) and card a84 (the defaults, on the merge desk's advice): a 24-hour
hand-over to the super admin; with no case manager to vouch, the super admin speaks to the person first; a decided
request kept 90 days. The merge desk read the plan (13 October, 19:21) and added: a super admin's account can never be
moved this way; a staff account goes straight to the super admin; the "spoke to them" tick is recorded; the temporary
sign-in never makes a profile or starts setting one up; nothing leaves Pam but texts, and none while texts are off.
Then (19:48), after Lena checked the Privacy words: **the super admin decides every request for now** — showing the
account's case manager the typed details and the new number would widen what a case manager can see, which
`transparency.ts` forbids without Will's signature and members being told first — so there is no case manager step and
no 24-hour hand-over; every Approve needs the tick; a denial deletes the new number's sign-in at once; an undecided
request is purged 90 days after it was made, sign-in included.

## What

- **The way in:** "New number?" beside Privacy on Sign in (not on Join), to `/signin/new-number/`.
- **The new number proves itself** with the normal sign-in code. That makes a sign-in with no profile (the temporary
  sign-in). Sign in and Join send such a sign-in to its request, never into setting up an account, and nothing it can
  call makes a profile.
- **The old account:** old number, first and last name, city, who at Pam knows them (optional). The reply is the same
  whatever is typed (`submit_number_change` returns `received`): only the server and the person deciding know whether
  the old number has an account. Limits: one waiting request per new number, three a day per new number, three a week
  per old number.
- **Who decides:** the super admin, every request. The `routed_to` / `case_manager_id` columns stay (always
  'super_admin' / null) so a case manager step can come back if Will signs the contract line. A super admin's account →
  protected: the person sees "still checking", the super admin sees it marked, with Deny only.
- **The side by side:** what was typed beside the account (name, city, who invited them, last active), each line that
  differs marked, the new number in full (to call) and the old number's last 4.
- **The tick:** every Approve needs "I spoke to this person and I'm sure it's them." The tick is on the request and in
  the audit row; the audit row has the request id, the decision, who decided and the tick: no number, name or city
  (D-443).
- **A no** deletes the new number's sign-in at once (`remove_temporary_signin`: a sign-in with no profile, never one
  with an account).
- **The move:** on a yes, the `move-number` Edge Function removes the temporary sign-in, moves the account's sign-in to
  the new number (Supabase Auth admin) and calls `number_change_moved` (the profile's number, the request, the audit
  row). It moves only what `number_change_to_move` offers that caller. If it fails, "Move it now" tries again.
- **Forgetting:** a nightly job deletes a request (both numbers, the typed name, city and answer) 90 days after it is
  decided, or 90 days after it was made if nobody decided it, then with its sign-in. Deleting the account deletes its
  requests. After a yes the old number is on no account; it lives only in the request row.
- **Where a number can land:** the request row; `auth.users` (the temporary sign-in, deleted on a yes, a no or the
  purge; the account's own, which becomes the new number); `profiles.phone` (the new number). Not in `audit_log`,
  `notifications`, `outbound_messages` or the function's logs. Supabase Auth's own log of sign-ins may hold the number
  a code was sent to (Auth's tables, not Pam's).
- **One place for Will's answers:** `public.number_change_rules()` holds the tick (true), 90 and the two limits.
- **The free-text label** is Sage's, signed: "Who on Pam knows you? Like your guide."

## Not in this

- An alert to the super admin when a request arrives (Nico's); until then it is on Requests.
- The text to the old number ("Someone asked to move your Pam account…"), once texts are live (Nico's, Sage's words).
- The Privacy line: waits for Lena's check and Will's signature; not in the locale files.

## What a later session might reverse

- The tick, the 90 days and the limits: one line each in `number_change_rules()`.
- A case manager step (the member's own case manager deciding first), if Will signs the transparency line for it.
