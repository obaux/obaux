# 2026-10-11 — Voice & UX copy: what people type into Support search

**Branch:** `claude/help-search-phrases` · **Lane:** Voice & UX copy (Sage), with Wren (website)

## What changed

- `apps/site/src/content/search-phrases.ts`: about 75 phrases in people's own words ("why didnt i get a
  code", "they said i missed it", "who can see this", "why is this happening"), each mapped to the post that
  answers it, or to `null` with a line on what the missing post needs. `SEARCH_GAPS` lists every phrase no
  published post answers (drafts count as gaps, because the site doesn't show them).
- `apps/site/test/search-phrases.test.ts`: every named post exists, every gap says what it needs, no
  phrase is listed twice.
- No change to search itself. Wren builds the matching against this list; today's search needs every
  typed word to appear in a post, so most of these find nothing.

## What was wrong, and what missed it

- Search treats "why didnt i get a code" as five required words, so stuck people get "Nothing matches
  yet". Nothing tested search against real phrases; this file is that test's input.

## Decisions made

- None. The shape of the file is a proposal to Wren.

## Verified

| Check | Result |
|---|---|
| `pnpm exec vitest run` in `apps/site` | 4 files, 30 tests pass |
| `tsc --noEmit` in `apps/site` | clean |

## Left undone

- The gaps, to write with Wren: start here when something isn't working; talking to a person; your
  language; changing your number; deleting your account; finding a place; telling Pam a place is wrong;
  is the place told about my visit (D-498); a visit marked missed; the program's calendar.
- English only (Will).

## Needs a human

- None yet. The gap posts go to Will when written.
