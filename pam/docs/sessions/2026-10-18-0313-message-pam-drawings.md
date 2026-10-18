# 2026-10-18 — message Pam drawings

**Branch:** `claude/pam-design-message-pam` · **Lane:** design system (Dot)

## What changed

Drawings for card "Message Pam" from Nico's plan (claude/messages-plan-message-pam @ bfeead66): `stories/roles/states/MessagePam.stories.tsx` (Design/Message Pam (plan)), M1 Messages with Pam as the one row (and with others), M2 the Pam thread (pinned lines, a reply from Pam), M3 Contact Pam (Help's first row, and the empty thread it opens), M4 the super admin's Home with a Pam inbox row and its plain count, M5 the inbox (Waiting | Closed), M6 the super admin's thread (and starting one), M7 the New message sheet with members and programs. Pictures in `docs/design/review/2026-10-18-message-pam-ab/` at 390 and 320, light, dark and Arabic. Nothing is built: the words are placeholders for Sage, the Arabic are stand-ins, and no app code changed.

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

## Round 2 (18 October, 03:50): two versions, for Will to choose

Mira asked for both: **A** (Iris's smallest v1: "Write to Pam" under Help's answers, the person writes first, no Pam row in Messages until they do, the super admin answers and does not start a conversation with a member) and **B** (Nico's plan: Pam in everyone's Messages, the super admin starts a conversation with a member or a program). Both carry Sage's draft card (ledger d9174a60, unsigned) at the top of the thread and Ava's inbox (claude/pam-message-pam-admin-plan @ c50f0f8f): a Home row first with a plain count, `/pam/messages/` with Waiting for Pam (longest first, with the wait), Answered, Closed folded, the stat line, saved replies and Close in the thread's menu. Stories: `MessagePam.stories.tsx` X1-X6 (both), A1-A3, B1-B6. The first-round pictures (single plan) were replaced by `2026-10-18-message-pam-ab/`. The card's 911/988 paragraph is second and bold; measured at 320 x 568 with the keyboard closed it ends at y=343 of 568 (composer top 422), in English and Arabic (296), so it reads without scrolling when a thread opens at its card. The build must open an empty thread at the card, not at the bottom (ThreadView scrolls to the latest message).

Round 2b (Mira, 03:16): A is its own sheet (`sheet-A-*`: Messages before and after writing, Help with Write to Pam first, the thread, the inbox, answering, and Everyone with no message button at all, so the super admin only answers); the composer in a Pam thread reads "Write to Pam", has no document button, and the microphone stays; the photo button is drawn only in `X7_ThreadWithPhoto`, the version Will can choose. ThreadView's composer has no props for any of that yet, so the drawing rewrites it after it mounts; the build adds them (Nico's). Help's "Write to Pam" is under the answers in X3 (Iris's research) and first in A4 (Mira's 03:16 note): Will or Mira picks.
