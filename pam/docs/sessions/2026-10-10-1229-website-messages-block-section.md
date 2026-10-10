# 2026-10-10 — website: Block, in "Messages in Pam"

**Branch:** `claude/compassionate-bohr-mzrchf` (restarted from main `e351763`) · **Lane:** Website

## What changed

- "Messages in Pam" gets a section, "If you do not want messages from someone" (Mira, 12:06 and 12:28):
  where Block is (a conversation's More options → Options → "Block this person"), that Pam asks first
  (the app's own sentence, quoted from `messages.block.body`), that the other person is told (the
  `messages.blocked.theirs.*` words, with a picture), what the blocker sees (`messages.blocked.mine.*`),
  that only the blocker can undo it (More options → "Unblock this person" → "Unblock"), that anyone in a
  conversation can block, and that blocking is not reporting. One new picture, `blocked.png`.
- The post's header comment no longer says blocking is left out.
- Nico's removal of the legacy Messages page (case managers and super admins now get the same screen, with
  "Conversations | Reported") was checked against the post: nothing in it says otherwise.

## What was wrong, and what missed it

- Nothing found. The old header comment ("no screen has it") was true when written and went stale when
  D-463 merged; nothing tells the website lane when a feature a post leaves out ships. Found because Mira
  said so, from my own flag.

## Decisions made

None new.

## Verified

- tsc, site tests, normal build and `a11y.mjs` (numbers in the READY note); the picture is from main's
  Storybook (`member-created-states-blocking--conversation-blocked-me`), read before use.

## Left undone

- The Reported tab for case managers and super admins is not described in a post.
- Unchecked: the deployed app.

## Needs a human

- Will: sign the English of About Pam.
