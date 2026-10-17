# 2026-10-17 — website post dates follow words

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** website

## What changed
- Posts' "Updated" dates moved to the day their words went live (D-598): What others can see 17 Oct; Is the place told, Points and badges, Joining as staff, Sending an invite, Staff requests (draft), Signing a program's rules 16 Oct; Who is my guide, Texts from Pam, Joining Pam, Keeping your listing, Case manager assignments 11 Oct.
- `post-updated.json` and `test/post-dates.test.tsx`: a fingerprint of each post's rendered words beside its date; the test fails when the words change and the date does not. `pnpm --filter @pam/site posts:date <slug>=<day>` is the fix. `vitest.config.ts` for the JSX runtime.

## What was wrong, and what missed it
- Nothing moved a post's date when its words changed (Iris's b52 re-test). Six posts were a day or more stale.

## Decisions made
D-598.

## Verified
Site tests 123 pass, tsc clean. Proof it bites: changing one phrase of What others can see fails the test with "the words of what-others-can-see changed and its date did not"; changing only its date fails with "not the recorded day".

## Left undone
The held new-number patch will fail the site test when it is applied until `posts:date` is run for it.

## Needs a human
Nothing.
