# 2026-10-13 — languages-legal the Last updated date on Privacy and Terms

**Branch:** `claude/lena-legal-date` · **Lane:** Languages & legal (Lena)

## What changed

- **Both dates were stale** (Iris's b25 re-test, W2; Mira, 03:52). Privacy said 10 October; its visible paragraphs last changed at the b25 merge on 13 October (`1f696104`; before that 12 October for `sharing.p2` and `p9`/`p10`, 11 October for the Contact, copy, delete and limits lines). The Terms said 9 October; their last change was `56613917` on 11 October (`limits.p2`, `limits.p3`; before that `your-account.p3`, `being-decent.p3`/`p4`). Privacy is now 13 October 2026 and the Terms 11 October 2026, in seven languages. The date is the day a change was merged to `main`, in UTC (the deploy follows within the hour, so it is the live day too except across midnight).
- **Why nothing noticed:** nothing connected the words to the date. Now `packages/config/src/legal-updated.json` holds, per document, the day and a SHA-256 of its English words (title, introduction, section titles, paragraphs, in key order), and `test/legal-updated.test.ts` is red when the words change and the fingerprint does not, when any of the seven languages shows a different date, and when the rule for "which keys are the document" drifts from `legalKeys()` in `legal.ts`. To move the date: `pnpm --filter @pam/config legal:date <privacy|terms|all> <YYYY-MM-DD>` (`scripts/legal-date.mjs`; logic in `src/legal-updated.ts`, which runs under Node's type stripping like `copy-sync.ts`). It refuses a date earlier than the recorded one. `docs/copy-changes.md` has a section.
- **One thing the cross-check found:** `privacy.s.translation.*` (the Claude/Anthropic section, a70) is in the bundle but not on the page while `MESSAGE_TRANSLATION.enabled` is false (D-423), so its changes are not a change to what a reader reads. The fingerprint counts the section only while it is on the page; switching translation on moves the fingerprint, so the date moves with it. (Mira's note listed translation p2 among the changed lines; it is true of the bundle, not yet of the page.)

## What was wrong, and what missed it

- **A "Last updated" line nobody owned.** It was written once (6 October) and moved by hand twice; every later change to a paragraph passed every test, because no test related the date to the words. The same was true of the Terms, which no one had looked at.
- **My own slip while building it:** I ran `legal:date all 2026-10-13`, which moved the Terms to 13 October too (the command applies one date to every document it names). I caught it from the output, reset the language files and the record and redid it as Privacy 13 and Terms 11. The command prints each document and date it set; use one document at a time unless both really share the day.

## Decisions made

None new. The date is a fact, not a promise (Mira); Sage signs the sentence under A29.

## Verified

Config: 47 files, 1233 passed, 1 skipped; `copy:status` in step; `tsc` clean. The check goes red on a changed word in a Privacy paragraph and on one language showing an old Terms date (both tried, then undone). Nothing else in the repo pins the old dates. Not run: the Storybook fit audit (the date line is one sentence of the same length).

## Left undone

- Sage signs the two English lines (A29): `privacy.updated` "Last updated 13 October 2026." and `terms.updated` "Last updated 11 October 2026."
- **Whoever merges a Privacy or Terms change moves the date in the same change** (`legal:date`), starting with the street-search line (`sharing.p7`, `claude/lena-street-search-line`), which turns this check red the day it lands, on purpose. The Google Calendar lines (a71) the same.
- Native readers for every translation, as before.

## Needs a human

Nothing new.
