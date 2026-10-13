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
   Will's, kept: `join.code.question` "Did someone invite you via code?" and `join.code.reveal` "Click
   here" (his "click here", capitalised as it starts its line). Sage proposed "Did someone invite you
   with a code?" and "Enter your code", since "click here" says nothing read out of context; Will
   signed card a82 on 13 October, 18:40 ("signed on all") without taking them, so her commit was
   reverted.

5. **The link is underlined** (Dot, D-564: `TextLink isUnderlined`), since it sits among words and reveals a field.
6. **Sage's signed fixes (13 October, 06:58)**, held since D-446:
   - `join.staff.body`: "A person at Pam checks every request by hand before we open an account. We will
     text you the answer." (no time promised; approval texts the link, 0054, and a denial queues a text, 0055).
   - `admin.caseload.empty.body`: "When someone joins with an invite from you, they show up here. To invite
     someone, open Profile and choose Invite someone." ("invite", true of a link or a code).
   - `invite.expired.sent.body`: "We'll email a new link to {email}. Open it on this phone. It works for 30 days."
7. **The expired-link page offers an email only while invite emails go out.** Sage: "while invite emails are
   switched off, the whole 'Email me a new link' offer is untrue. Please hide that offer, plus the sent state,
   behind the same switch rather than rewording them." There was no switch the app could read: the sender's
   is the `INVITE_EMAILS` secret on `send-invite-emails`. Migration `20261013070505` adds
   `app_settings.invite_emails_live` (readable signed out, 0009), read by `useSettingOn` (the
   `useTextsLive` pattern; unknown counts as off). Seeded **'on'**: invite emails already go out
   (`INVITE_EMAILS` on since 10 October; the merge desk saw two staff invites sent), so 'off' would hide
   an offer that works (Mira, 13 October, 07:36). On: the form and "Check your email" as before. Off: the
   page says the link ran out and offers Contact Pam (the help desk, `help.contact.action`, no new words),
   so it does not dead-end. The row and the `INVITE_EMAILS` secret are switched together, both ways.

## What a later session might reverse

- The link's words (Sage).
- The member line is four sentences. At 320×568 it pushed "Send me a code" 12px below the first screen
  until Dot's smaller hero on short screens (D-564, merged in); the words stay Will's.
- One switch rather than two: `send-invite-emails` could read `invite_emails_live` instead of its secret.
