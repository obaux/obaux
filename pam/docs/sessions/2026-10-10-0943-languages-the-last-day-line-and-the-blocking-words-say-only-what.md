# 2026-10-10 — Languages — the last-day line and the blocking words say only what is true

**Branch:** `claude/lena-honest-promises` · **Lane:** Languages & legal (Lena)

Will's rule, via the merge desk: every screen that promises something Pam does not do is built to keep the promise or
rewritten. Wren found two in my copy. One small branch after the tags (D-455) were ready.

## What changed

- **`transparency.canSee.lastActive`** is now "The last day you used Pam." in all seven languages, with the contract's
  `en`, its comments and a test. A case manager sees it; a program does not (0062, `provider_linked_members()` returns an id
  and a first name), whatever D-242 intended. D-242's program half stays open.
- **Blocking.** Mira first decided (b): change the words to what was true then (no control existed). Nico's Block
  control (D-463) landed on `main` the same morning, so the words came back in their true form and say where: privacy
  "Block someone, or report a message that is not safe. Both are in a conversation's ⋯ menu."; terms "You can block
  someone you talk to, from a conversation's ⋯ menu. Neither of you can send messages there after that. They will see that
  messages are blocked." (Not "anyone", not "they will not know".)
- **Tests:** `legal.test.ts` "promises that are kept (D-465)".
- **The public site's table** (`apps/site`, Wren's lane, with Mira's OK): the last-day row says No for a program.
- **Decision D-465;** changelog fragment; before-launch (native reader).

## What was wrong, and what missed it

- **A claim the database never kept, written down as kept.** D-242 (Will, 3 October) said a program sees the last day a
  member used Pam; the transparency screen was changed to say so and the database was not. The contract's own comment
  said "the database does not hand it to a program yet", so the gap was known and recorded, but nothing stopped the
  member-facing line from promising it. Wren found it by reading the screen against the code, not a test. A test cannot
  prove the database gives a program something, only that it does not: `04_transparency_contract_test.sql` part 3 holds
  the *opposite* and passed the whole time. The new test pins the wording to that fact.
- **The same promise repeated where I did not look.** The public site's "What others can see" table
  (`apps/site/src/content/WhatOthersCanSee.tsx`) said "Yes" for a program. It is Wren's file; I reported it, and Mira
  OK'd the one-cell change on this branch (the row is now Yes / No / No), so the app and the public page change in the
  same merge. `before-launch.md` had already named it as a follow-up of any change to `transparency.ts`.
- **"They will not know" had never been true of the design:** `conversation_block_state` tells the blocked person
  (`blocked_me`), so the sentence was wrong even once a control existed.

## Decisions made

- **D-465** — the last-day line and the blocking sentences say only what is true; the mail-service paragraph is not part
  of it (its English is with Will).

## Verified

The long checks ran on `ca9a11a` (this branch with `main` at `3ddac79` merged). `main` then moved five more merges
(legal tabs, the STOP/START release steps, services list, no example policies, the homepage card); I merged it
(`96b2e70`, no conflicts) and re-ran the fast checks rather than start a fourth hour-long run; the merge desk measures the
merged tree before it merges.

| Check | Result |
|---|---|
| `@pam/config` unit tests, on `96b2e70` | 995 pass (the two new "promises that are kept" tests are in `legal.test.ts`) |
| `@pam/ui` / `@pam/web` / `@pam/site` unit tests | 117 / 71 / 18 pass |
| Typecheck `@pam/web`, `@pam/site`; `copy:status` | clean; all languages in step |
| Storybook build, on `ca9a11a` | completes |
| Browser suite, all three projects, on `ca9a11a` | **909 passed, 0 failed** (11.6 minutes) |
| Fit audit, 480+ stories × en, ru, ar, zh-CN, pseudo at 320px, on `ca9a11a` | 92 new in a language: 84 accepted, **8 not accepted**; see below |

**The eight not accepted** are in stories this branch does not touch:
- four `pseudo clamp` on `member-created--explore` (the same four as on `main`, found in the tags job);
- two `ru overlap` on `member-created-states-blocking--conversation-blocked-by-me` and `…-blocked-me` (a sender name
  over the first message: the thread scrolling under the header, the class the merge desk added seven entries for on
  `conversation-file-refused` and expects Dot's scroller job to retire) — Nico's new Block stories;
- one `ru cut` and one `pseudo cut` on `member-created-states-saved-trips--one-trip-saved` (a date line in the card
  that scrolls and fades at its foot, `partial=true`, like the Trips entries already accepted) — Piper's saved-trips
  story.
The merge desk adds entries at merge when it has looked; I did not add any.

**The pages this branch changes**, privacy, terms, legal and the transparency reading, were clean in the fit audit.

**Not run:** the database suite (no change in `packages/db`); a native reader or screen reader on any of it.

## Left undone

- The line in the Block session's STATUS section that said the terms' "they will not know" was untrue (it is fixed here;
  the merge desk drops it at merge).
- The mail-service paragraph on the privacy page: its English is with Will; translate only after he says yes.
- The six translations of the new terms and privacy sentences are mine; promises, so a native reader still has to read them.

## Needs a human

- Will: the mail-service sentence ("When Pam emails a case manager or a program, a company that sends email for us gets the
  email address and the email. It may not use them for anything else.").
- A native reader for the reworded terms and privacy sentences (before-launch).
