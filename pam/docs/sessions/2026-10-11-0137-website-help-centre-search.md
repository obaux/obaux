# 2026-10-11 — website: help-centre search

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Public website (Wren), with Sage (voice and UX copy)

## What changed

- New `apps/site/src/lib/search.ts` (stop words, light stemming, weighted ranking, phrase hits, gap detection), used by `SupportScreen`.
- Sage's `apps/site/src/content/search-phrases.ts` (69 phrases; 21 with no published post) merged from `claude/help-search-phrases` in her shape (`answer`, `also`, `gap`); my first, empty file was dropped. `docs/help-centre-gaps.md` lists the 21 gaps.
- Empty result: plain "Nothing matched", Browse by topic, and the "Still stuck?" card. A known gap says "We do not have an article for that yet".
- `apps/site/test/search.test.ts`; a11y script scans the nothing-found state too; two Storybook stories (own words, nothing found).

## What was wrong, and what missed it

`words.every(...)` required every typed word to appear in a post, so any natural sentence found nothing, and nothing tested a sentence. The new test runs every phrase in the use-case file through the real search, which is the check that was missing.

## Decisions made

D-506.

## Verified

| Check | Result |
|---|---|
| `@pam/site` tests | 36 passed (10 new search tests) |
| Typechecks `@pam/site`, `@pam/web` | pass |
| Site a11y (axe) | 90 scans, 0 problems (5 new: the nothing-found state, 5 views) |

## Left undone

- The 21 gap posts (Sage and Wren; Will signs the words), starting with "When something isn’t working, start here" ("why is this happening"). As each is published, its phrase gets an `answer` and moves to Done in the gaps doc.
- Typing mistakes are not forgiven (no fuzzy matching).

## Needs a human

Will: the words of any gap post before it ships; and whether he wants the "Ask Pam" box.
