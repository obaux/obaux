# 2026-10-18 — message Pam drawings

**Branch:** `claude/pam-design-message-pam` · **Lane:** design system (Dot)

## What changed

Drawings for card "Message Pam" from Nico's plan (claude/messages-plan-message-pam @ bfeead66): `stories/roles/states/MessagePam.stories.tsx` (Design/Message Pam (plan)), M1 Messages with Pam as the one row (and with others), M2 the Pam thread (pinned lines, a reply from Pam), M3 Contact Pam (Help's first row, and the empty thread it opens), M4 the super admin's Home with a Pam inbox row and its plain count, M5 the inbox (Waiting | Closed), M6 the super admin's thread (and starting one), M7 the New message sheet with members and programs. Pictures in `docs/design/review/2026-10-18-message-pam/` at 390 and 320, light, dark and Arabic. Nothing is built: the words are placeholders for Sage, the Arabic are stand-ins, and no app code changed.

## What was wrong, and what missed it

Nothing was wrong; this is a drawing job. Two things the drawings had to invent and Nico's plan should confirm: Pam's mark is the app icon (a white P on Pam's green, never a face) as the avatar; and the two pinned lines above the composer need a slot that `ThreadView` does not have today (the story places them with a measured fixed strip; Nico's build adds the slot).

## Decisions made

None. Nothing is decided until Will picks on the card.

## Verified

Every screen shot at 390 and 320 in light, dark and Arabic from a static Storybook build; no sideways scroll in any. The thread's pinned lines sit clear of the composer in all of them.

## Left undone

Where Ava's inbox sits: drawn as a Home row that opens a list (M4, M5), and the list on the Messages tab's frame; her file may put it elsewhere (a third section on Messages, beside Conversations | Reported). Sage's words and Lena's Arabic. The composer's placeholder still reads "Write a message" (ThreadView's own); Pam's would read "Write to Pam" in the build.

## Needs a human

Will picks on the card (Nico's nine questions).
