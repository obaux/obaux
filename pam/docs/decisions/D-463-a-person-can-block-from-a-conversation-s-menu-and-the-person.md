# D-463 — A person can block from a conversation's ⋯ menu, and the person blocked is told

**Date:** 2026-10-10 · **Branch:** `claude/messages-block`

Will, 10 October 2026, through Mira: keep the promises Pam can keep. The terms said "You can
block anyone, and they will not know" and the privacy page promised blocking from inside a chat;
a search of the app on 10 October (Wren's audit, my check) found no control at all — only the
database half (0069/0076: `blocks`, `block_in_conversation`, `unblock_in_conversation`,
`conversation_block_state`). Mira: "yes, build it ... this one is about safety."

## What was built

- **A Block row in a conversation's ⋯ menu** (`messages/thread/options`). It asks first, in place:
  "Block this person?", what a block does, one primary button ("Block") and "Not now" beside it.
  Afterwards the same row says **Unblock this person**, with its own confirmation. An example
  conversation does it on the screen and writes nothing.
- **In the conversation, the composer gives way to a notice** (`BlockedNotice`), for both sides:
  the blocker is told how to undo it (⋯ → Unblock); the person blocked is told plainly that this
  person has blocked messages in the conversation, that they can still read it, and to call Pam
  with questions. Everything said stays on the screen and can still be reported (0076).
- `lib/blocking.ts` (the three calls and `useBlockState`), seven languages of strings, a
  Storybook state for each (`Member/Created/States/Blocking`), two Playwright tests, a database
  test (`31_block_in_conversation_test.sql`) for what the screen relies on that test 12 does not
  attack, and the flow map's ⋯ node.

## The choices a later session might question

1. **"They will not know" is gone, on purpose.** `conversation_block_state` tells the blocked
   person (`blocked_me`), as test 12 asserts, and the composer needs to say something rather than
   fail; saying it plainly is kinder than a send that errors. The terms and privacy sentences
   (Languages & legal) should say a person can block from a conversation, that the other person is
   told messages are blocked, and that it can be undone.
2. **It is undoable by the person who made it, and only by them** (0076; test 12 and 30). 0075's
   permanent block is the older member-to-member connection kind and is not what this does. The
   confirmation says "you can unblock them any time from this menu" because that is true.
3. **Staff can block a member and a member can block staff** — the database allows both and the
   button is shown to everyone in a conversation. Blocking one's own case manager or program cuts a
   member off from them until they unblock; the confirmation says what a block does and offers "Not
   now" first. If Will wants the button hidden for staff, it is one condition on the row.
4. **Confirmation in place, not a new screen**: one primary action per screen (D-239), no new route
   or prototype entry; the confirmation is the options page's other state.
5. **No new icon** (a shield, which the kit has, marks the row); a "no entry" icon is Design
   system's to draw if wanted.

## Not done

- The privacy and terms wording (Languages & legal): say where the control is, and that it is
  undoable and the other person is told.
- Hiding Block from staff, if Will prefers.
- Publishing the Figma flow map (`flows.mjs` is updated; regenerating and publishing needs Figma).
- A Block control on a person's page: the promise is from inside a conversation, which is what exists.
