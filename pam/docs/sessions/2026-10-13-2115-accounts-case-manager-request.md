# 2026-10-13 — accounts case-manager-request

**Branch:** `claude/pam-case-manager-request` · **Lane:** Accounts & invites (Ava)

Plan 2 from the merge desk's order (13 October 19:21: the new number first, then this), built to the firm rules of
19:27, 19:48 and 19:51 and Lena's 19:30 catch. The same session first applied Sage's seven signed changes to
`newNumber.*` on `claude/pam-new-number` (1d76b89d).

## What changed

- **Database** (migration `20261013203725_a_case_manager_asks_from_the_website_and_old_requests_are.sql`, expand
  only): `staff_requests.organization` and `.work_email`; `staff_request_rules()` (30 / 90 days, email required);
  `request_case_manager_access(first, last, city, organization, work_email, language)`; a `before update of decision`
  trigger that moves the work email into `profile_emails` on approval and clears it from the row;
  `remove_temporary_signin` (same body as D-567's); `purge_staff_requests()` and its pg_cron job at 03:55.
  `request_staff_access`, `review_staff_request` and every policy are untouched.
- **App:** `/join/case-manager/` (`CaseManagerRequestScreen`): prove the phone, About you, sent / still checking /
  refused with Ask again / you already have an account. `useCaseManagerRequest.ts`. Join sends a no-profile sign-in
  with a case manager request to that page. Requests and the request page show where they work and the work email.
  `PhoneSignInCard` gains the `title` prop (the same lines as on `claude/pam-new-number`, so the two merge cleanly);
  `TextField` gains the `organization` purpose.
- **Strings:** 21 `caseManager.*` keys and `requests.organization`, `requests.workEmail` (23), English only.
- **Storybook:** Member › Join as a case manager; Super admin › A case manager's request (fixture r-1 now has an
  organization and an example email); the route in the prototype.
- **Pictures:** `docs/design/review/2026-10-13-case-manager-request/` (10 screens, light and dark, 390 wide).

## What was wrong, and what missed it

- **Join hung on Loading in every join test.** The first version of `myStaffRequest` asked `auth.getUser()` (a
  network call) before reading the row; in the tests that call was never answered, so Join waited forever. The new
  spec passed because it stubs that call. It now reads the id from the session the browser holds and gives the row
  read a 3-second limit (no answer reads as no request). The join spec (and 13 others, 462 tests on three projects)
  now pass. Lesson: a check that gates a screen everyone passes through needs a limit, not just a stub.
- **I read "texts are off" too widely.** The first draft avoided "We will text you" because texts_live is off, and
  flagged `join.staff.*` as untrue. Sage corrected it: a staff-request decision is an account text, sent whatever
  texts_live says (D-481). The waiting body now says the answer is texted (Sage's signed wording), and the e2e test
  checks for it. Lesson: read the text's own rule (migration 20261010141859) before assuming the switch covers it.

## Decisions made

- D-568 (the whole job, with what would reasonably be reversed).

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/db test` | all pass; test 73: 47 checks |
| `tsc` (web), `@pam/ui` typecheck | clean |
| `@pam/web` vitest | 173 passed |
| `@pam/ui` vitest | 124 passed |
| `@pam/config` vitest | 12 failed, all the 23 new keys missing in six languages (Lena); 1298 passed |
| Playwright: case-manager-request, join, staff-request-approve, signin-short, consent, invite, admin, a11y, account, add-my-program, signin-next, focus-text-boxes, back, tap-targets × 3 projects | 462 passed |
| `build-storybook` | passes; both new stories render (checked in the iframe) |

## Left undone

- The website button (Wren). Sage reads the 23 strings; Lena translates after.
- Whether `join.staff.*` should stop promising a text (Sage / the merge desk).

## Needs a human

- The merge desk: confirm postgres may `delete from auth.users` on live (the same question as D-567), then apply
  after `list_migrations`. Nothing to deploy beyond the migration and the app.
- Will: the 30 / 90 days and "super admin alone" are his card a84 defaults; a change is one line.

- 21:35: Sage signed the 23 strings (22 as written; `caseManager.waiting.body` changed). Mira chose (a): the purge covers every staff request.
