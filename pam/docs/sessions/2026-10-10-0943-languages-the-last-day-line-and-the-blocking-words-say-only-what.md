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
- **Decision D-465;** changelog fragment; before-launch (native reader).

## What was wrong, and what missed it

- **A claim the database never kept, written down as kept.** D-242 (Will, 3 October) said a program sees the last day a
  member used Pam; the transparency screen was changed to say so and the database was not. The contract's own comment
  said "the database does not hand it to a program yet", so the gap was known and recorded, but nothing stopped the
  member-facing line from promising it. Wren found it by reading the screen against the code, not a test. A test cannot
  prove the database gives a program something, only that it does not: `04_transparency_contract_test.sql` part 3 holds
  the *opposite* and passed the whole time. The new test pins the wording to that fact.
- **The same promise repeated where I did not look.** The public site's "What others can see" table
  (`apps/site/src/content/WhatOthersCanSee.tsx`) still says "Yes" for a program; it is Wren's, reported to the merge
  desk. `before-launch.md` already named it as a follow-up of any change to `transparency.ts`.
- **"They will not know" had never been true of the design:** `conversation_block_state` tells the blocked person
  (`blocked_me`), so the sentence was wrong even once a control existed.

## Decisions made

- **D-465** — the last-day line and the blocking sentences say only what is true; the mail-service paragraph is not part
  of it (its English is with Will).

## Verified

Filled in when the long checks have finished (below).

## Left undone

- The public site's table row (Wren's file) and the line in the Block session's STATUS section that said the terms'
  "they will not know" was untrue (it is fixed here; drop it at merge).
- The mail-service paragraph on the privacy page: its English is with Will; translate only after he says yes.
- The six translations of the new terms and privacy sentences are mine; promises, so a native reader still has to read them.

## Needs a human

- Will: the mail-service sentence ("When Pam emails a case manager or a program, a company that sends email for us gets the
  email address and the email. It may not use them for anything else.").
- A native reader for the reworded terms and privacy sentences (before-launch).
