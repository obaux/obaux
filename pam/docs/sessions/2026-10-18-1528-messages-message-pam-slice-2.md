# 2026-10-18 — messages message pam slice 2

**Branch:** `claude/messages-pam-s0-s1a` · **Lane:** Messages & notifications (Nico)

## What changed

The person's side of Message Pam (D-605, D-609): Pam's row and conversation, the welcome and out-of-hours reply drawn from keys, `/messages/pam/`, Help's "Write to Pam", the limited account writing to Pam, per-message state in every conversation (Sending… / Not sent + Try again / Sent), a send that is kept when it fails and sent once on Try again. `pam_inbox()` skips welcome-only conversations (migration `20261018080342`). Test 82 got its own fixture.

## What was wrong, and what missed it

Try again could send a second copy when the first send had landed and only its answer was lost, and the look for the earlier message missed rows with no attachment kind. The e2e case "after a send that had in fact gone through" caught it across three projects; the fix reads a missing kind as none.

## Decisions made

D-609 (this slice). D-605 and D-606 earlier.

## Verified

`message-pam.spec.ts` 51/51 (narrow-320, dark-320, iphone-se); `messages.spec.ts` 276 passed plus the one fixed (the nine Try again runs pass); `tsc`; web vitest 200; config vitest 1430; DB suite passes; language-fit audit on the four new stories: nothing new in any language.

## Left undone

Photos with progress and retry (slice 3). Team screens (Ava). New string `messages.thread.attach.wrongType.pam.hint` needs Sage's signature; English-held translations are Lena's to do. `pamHoursLine` uses the locale's own hour format ("9 AM").

## Needs a human

Mira to apply `20261018080342` and, with the earlier ones, to flip nothing: the switch stays off until Lena's Privacy/Terms lines are live and Will says yes.
