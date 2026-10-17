# D-598 — A post's "Updated" date follows its words

**Date:** 2026-10-17 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Asked by:** the merge desk (17 October, 07:43), from Iris's b52 re-test: "What others can see" changed in b52 and still said "Updated October 10, 2026". Nothing moved a post's date the way `legal-updated.test.ts` moves Privacy's.

## Decided

- `apps/site/src/content/post-updated.json` records, for every post (drafts too), the day its words last went live and a SHA-256 fingerprint of them: the title, the summary, the text of the rendered body and the alt text of its pictures, whitespace squeezed. Keywords, topic, class names and layout are not part of it.
- `apps/site/test/post-dates.test.tsx` renders each body (`renderToStaticMarkup`, with StyleX stood in for, since only the text matters) and fails when the fingerprint is not the recorded one ("the words changed and the date did not"), when `updated` in `posts.ts` is not the recorded day, and when a post has no record. It also checks that the fingerprint is not blind (a changed, added or removed word, a different alt text, a different summary) and that markup and spacing are not words.
- The one fix is `pnpm --filter @pam/site posts:date <slug>=<YYYY-MM-DD>`: it records the fingerprint and writes `updated` in `posts.ts`. A new post runs it once for its slug.
- `apps/site/vitest.config.ts` turns on the automatic JSX runtime so a test can render a post (the site's `.tsx` is written for Next's).

## The dates moved with it (the day each change went live, UTC)

- 17 October: What others can see (b52: a92's clause and the saved-places box).
- 16 October: Is the place told, Points and badges, Joining as a case manager or program lead, Sending an invite (b49 and b50), and the two that are not on the live site: Staff requests (a draft) and Signing a program's rules (pictures, b50).
- 11 October: Who is my guide, Texts from Pam, Joining Pam, Keeping your listing up to date, Case manager assignments. Their words changed on 11 October (A28's "contact Pam", the Still stuck? labels) after their 10 October date. The commits are the evidence; the day is the commit's day, which may be a day before the deploy.
- Everything else keeps the date it showed; its fingerprint is recorded today as the baseline.

## What a later session might question

- **The baseline is today's words.** A post that was reworded and never re-dated before today shows the date it had; only the git history says otherwise. Only the ones above were found.
- **A held patch that adds a post** (the new-number post, D-571) has no record on the day it applies, so the site test fails until `posts:date new-phone-number=<day>` is run. That is the intended prompt.
- **Not a signature.** The date is a fact, as Privacy's is; Sage signs the words, not the date.
