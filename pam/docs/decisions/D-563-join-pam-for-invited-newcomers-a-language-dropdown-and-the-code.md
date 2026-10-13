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
3. **Join › About you: the language is a dropdown**, Dot's `@pam/ui/LanguageField` (D-561, her branch
   merged into this one at Mira's word): each language named in itself, its English tag before the
   name in the open list (D-451, D-455), mirrored in Arabic. It starts on the active language, changes
   the screen's words at once and is still sent as `language`. This replaces the chips of D-359/D-451.
4. **Join › About you: the code field is hidden** behind a question and a link that opens the field
   and moves focus into it. The field is open from the start when a code is already there (an invite
   link) or when a code needs fixing (`inviteProblem`), and once open it stays open. It keeps its
   label, `join.code.label`. The words are two keys only, so the versions differ in nothing else:
   Will's, built now (Mira, 06:47: "use Will's until he answers"): `join.code.question` "Did someone
   invite you via code?" and `join.code.reveal` "Click here" (his "click here", capitalised as it
   starts its line). Sage's, on Will's card: "Did someone invite you with a code?" and "Enter your
   code", since "click here" says nothing read out of context.

## What a later session might reverse

- The link's words (Sage).
- The member line is four sentences; at 320×568 it pins three lines over the hero and pushes "Send me
  a code" 12px below the first screen (`e2e/signin-short.spec.ts`, red on this branch). Shorter words
  or a smaller hero is a choice for Sage, Dot and Will, not made here.
