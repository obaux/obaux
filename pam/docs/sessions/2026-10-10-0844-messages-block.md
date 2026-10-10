# 2026-10-10 — Messages & notifications (Nico): Block, in a conversation's ⋯ menu

**Branch:** `claude/messages-block` · **Lane:** Messages & notifications

Job from Will via Mira (10 October): the terms promised "You can block anyone, and they will not know";
no control existed. Build it; then tell Lena where it is.

## What changed

- `lib/blocking.ts`; a Block / Unblock row with an in-place confirmation on the ⋯ page; `BlockedNotice` in the
  thread's composer place; seventeen strings in seven languages; Storybook states; two Playwright tests; a
  database test (30); flow map note; D-463.

## What was wrong, and what missed it

- A promise made on 13 September ("block someone ... from inside the chat") was built in the database in 0069
  and 0076 and never reached a screen. The database tests passed because they attack the rules, and nothing
  checked that every promise in the terms has a control. The app reads `conversation_block_state` nowhere
  else; a block, had one been made some other way, would have shown as a send that failed.
- Wording: "they will not know" was never true after 0076: the blocked person is told.

## Decisions made

- D-463.

## Verified

- Config tests 976 pass (twice), `copy:status` in step, `tsc` clean; database suite all pass with test 30;
  Storybook builds; fit audit on the blocking stories: three overlaps, all the known scroller artifact (a
  message line scrolled under the header, measured against the subtitle), the same class already accepted
  for the limited-account stories; nothing overlaps on screen (looked at 320px).
- Playwright: messages.spec (with the two new tests) on all three projects, 59 + 114 pass; back.spec on the narrow project.
- Not run: the full Playwright suite; nothing against the live database.

## Left undone

- The terms and privacy sentences (Languages & legal) — Lena has the facts in D-463.
- The Figma flow map is updated in `flows.mjs` and not regenerated or published.

## Needs a human

- Will: whether Block should be hidden for staff (D-463, choice 3).
