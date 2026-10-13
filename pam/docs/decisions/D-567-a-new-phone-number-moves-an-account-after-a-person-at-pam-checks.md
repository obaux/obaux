# D-567 — A new phone number moves an account, after a person at Pam checks it

**Date:** 2026-10-13 · **Branch:** `claude/pam-new-number`

**Decided by:** Will, card a73 (the request) and card a84 (the defaults, on the merge desk's advice): a 24-hour
hand-over to the super admin; with no case manager to vouch, the super admin speaks to the person first; a decided
request kept 90 days. The merge desk read the plan (13 October, 19:21) and added: a super admin's account can never be
moved this way; a staff account goes straight to the super admin; the "spoke to them" tick is recorded; the temporary
sign-in never makes a profile or starts setting one up; nothing leaves Pam but texts, and none while texts are off.

## What

- **The way in:** "New number?" beside Privacy on Sign in (not on Join), to `/signin/new-number/`.
- **The new number proves itself** with the normal sign-in code. That makes a sign-in with no profile (the temporary
  sign-in). Sign in and Join send such a sign-in to its request, never into setting up an account, and nothing it can
  call makes a profile.
- **The old account:** old number, first and last name, city, who at Pam knows them (optional). The reply is the same
  whatever is typed (`submit_number_change` returns `received`): only the server and the person deciding know whether
  the old number has an account. Limits: one waiting request per new number, three a day per new number, three a week
  per old number.
- **Who decides:** a member with a case manager → that case manager; undecided after 24 hours → the super admin too. A
  member with no case manager, a staff account, or no account → the super admin. A super admin's account → protected:
  the person sees "still checking", the super admin sees it marked, with Deny only.
- **The side by side:** what was typed beside the account (name, city, who invited them, last active), each line that
  differs marked, the new number in full (to call) and the old number's last 4.
- **The tick:** the super admin approves only after "I spoke to this person and I'm sure it's them." A case manager's
  approval is the vouch. The tick is on the request and in the audit row; the audit row has no name and no phone (D-443).
- **The move:** on a yes, the `move-number` Edge Function removes the temporary sign-in, moves the account's sign-in to
  the new number (Supabase Auth admin) and calls `number_change_moved` (the profile's number, the request, the audit
  row). It moves only what `number_change_to_move` offers that caller. If it fails, "Move it now" tries again.
- **Forgetting:** a nightly job deletes a request 90 days after it is decided, or after it was made if nobody decided
  it. Deleting the account deletes its requests.
- **One place for Will's answers:** `public.number_change_rules()` holds 24, true, 90 and the two limits.

## Not in this

- The alert to the case manager and the 24-hour alert to the super admin (Nico's); until then the request is on the
  member's page for the case manager and on Requests for the super admin.
- The text to the old number ("Someone asked to move your Pam account…"), once texts are live (Nico's, Sage's words).
- The Privacy line: waits for Lena's check and Will's signature; not in the locale files.
- A denied request leaves the temporary sign-in as a sign-in with no profile (proposed: remove it on a denial).

## What a later session might reverse

- The 24 hours, the tick, the 90 days and the limits: one line each in `number_change_rules()`.
- Whether a case manager may approve a staff member's move (today: never; the super admin decides staff).
