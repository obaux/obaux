# 2026-10-13 — Accounts & invites: a new phone number moves an account (a73)

**Branch:** `claude/pam-new-number` (from `main` at `ba39eb7e`) · **Lane:** Accounts & invites

The merge desk read the plan at 19:21 and said build it, with Will's a84 defaults and six additions (D-567 lists them).

## What changed

- **Database** (one expand migration, `20261013192951_…`): `number_change_requests` (no client policy), and the
  functions `number_change_rules` (Will's answers in one place), `submit_number_change`, `my_number_change`,
  `number_changes_to_decide`, `number_change_detail`, `decide_number_change`, `number_change_to_move`,
  `number_change_moved` (service role), `purge_number_change_requests` (nightly where pg_cron is). DB test 72.
- **Edge Function** `move-number` (handler + index; unit test `packages/config/test/move-number.test.ts`; listed in
  the third-party host guard as reaching nothing outside Pam).
- **Screens:** `/signin/new-number/` (`NewNumberScreen`), `/requests/number/` (`NumberChangeReviewScreen`), the "New
  number?" link (Sign in only), "New number" rows on Requests, a row on a case manager's member page; Sign in and Join
  send a sign-in that asked to its request. `PhoneSignInCard` takes a `title`; `@pam/ui` `TextField` gains the
  `oldPhone` purpose (no autofill of the phone's own number).
- 60 English strings (`newNumber.*`); stories (Member › Sign in — a new phone number; Super admin › Requests — a new
  phone number), prototype routes, fixtures; `e2e/new-number.spec.ts`.
- Pictures: `docs/design/review/2026-10-13-new-number/`.

## What was wrong, and what missed it

- The DB guard that every table with RLS has a policy (03_invariants) failed first: the table now has an explicit
  "no client" select policy, as the other service-only tables do.
- My first DB test read request ids while signed in as a user, which the table refuses (as it should); ids are now
  read once as the owner.
- The code card on the new page said "Sign in": the card now takes a title.

## Decisions made

- D-567.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/db test` | all pass (test 72: 44 checks) |
| `pnpm -r typecheck` | clean |
| Unit: ui / web / site | 124 / 173 / 95 |
| Unit: config | 1317 pass; 12 fail, all on the 64 new keys missing in six languages (Lena) |
| move-number unit | 7 pass |
| web build, bundle | builds; 10.0 kB to spare |
| build-storybook | builds |
| Playwright new-number, signin-short, consent, join, account, staff-request-approve, invite, admin, a11y, connect-examples-only (320, dark-320, iPhone SE) | 372 passed |

- **20:10, after Lena's check (Mira 19:48):** the super admin decides every request (no case manager step, no 24
  hours; the member's case manager sees nothing, transparency.ts); the tick on every Approve; a no deletes the new
  number's sign-in (`remove_temporary_signin`, `delete from auth.users` for a sign-in with no profile: the merge desk
  confirms postgres may do that live); the undecided purge takes the sign-in too; Sage's signed label "Who on Pam knows
  you? Like your guide."; 60 strings. DB test 72 rewritten (45 checks). Playwright 402 passed. Pictures retaken.

## Left undone

- Lena: 60 keys in six languages. Sage: signs the new sentences (A29).
- Nico: an alert to the super admin when a request arrives; the text to the old number once texts are live.
- The Privacy line (Lena checks, Will signs).
- W6 (b32) is not on `main` yet; it touches `SignInScreen`, `JoinScreen`, `PhoneSignInCard` and the footer, so its merge
  into this branch is expected to need care.

## Needs a human

- Will: the pictures (card a73/a84); the Privacy line.
- The merge desk: apply the migration after `list_migrations`; deploy `move-number` with JWT verification on.
