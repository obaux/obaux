# D-563 — Join Pam for invited newcomers, a language dropdown, and the code field behind a question

**Date:** 2026-10-13 · **Branch:** `claude/pam-join-first-time-wording`

**Decided by:** Will. W6 (Iris's member flow): the first-time words drafted on 11 October, signed
"w6 is approved by me" (13 October, in Ava's session). The Join screen changes, relayed by the merge
desk with his screenshots (13 October, 06:00 UTC): "Now with all these languages, let's bring back
the dropdown, the chips are taking up too much space." and "The code question should be 'Did someone
invite you via code?' If yes, 'click here' to enter code. Clicking the link will show the input field
to type code. otherwise let's hide it so it doesn't take up real estate."

## What

1. **Sign in, opened from an invite** (`/signin/?invite=…`): the card's title is "Join Pam"
   (`signin.title.invited`), not "Sign in", and the pinned line says what happens next, in Will's
   signed words (`signin.invited.member|admin|provider`). Without an invite nothing changes.
2. **The expired-link page keeps the old line** under keys of its own
   (`invite.expired.invited.*`, the existing words and translations moved, nothing new to sign):
   "Start with your phone number. We'll text you a code" would be untrue on a page that cannot sign
   anybody in.
3. **Join › About you: the language is a dropdown** (`@pam/ui/Dropdown`), each language named in
   itself. It starts on the active language, changes the screen's words at once and is still sent as
   `language`. This reverses the chips of D-359/D-451; the English tag before each name (D-451, D-455)
   went with them, pending Dot's look for the control.
4. **Join › About you: the code field is hidden** behind "Did someone invite you via code?" and a link,
   "If yes, click here to enter code." The link opens the field and moves focus into it. The field is
   open from the start when a code is already there (an invite link) or when a code needs fixing
   (`inviteProblem`), and once open it stays open. The field keeps its label, `join.code.label`.
   The link text is Will's sentence whole, so it says what it does even read out of context; Sage may
   propose other words, which go back to Will.

## What a later session might reverse

- The language tags (D-451) inside the dropdown, if Dot's control can carry them.
- The link's words (Sage).
- The member line is four sentences; at 320×568 it pins three lines over the hero and pushes "Send me
  a code" 12px below the first screen (`e2e/signin-short.spec.ts`, red on this branch). Shorter words
  or a smaller hero is a choice for Sage, Dot and Will, not made here.
