# D-609 — Message Pam: slice 2, the person's side

**Date:** 2026-10-18 · **Branch:** `claude/messages-pam-s0-s1a`

**Decided by:** Will, 18 October 2026 (card a100, D-605): Pam is a conversation in everyone's Messages from day one. The detail below follows from those answers and Mira's notes of the same day.

## What

- **Every conversation shows each message's own state** (not only Pam's). "Sending…" while it goes, "Not sent" with a 48px "Try again" when it did not, a quiet "Sent" under the last message of mine. A failed message is kept, with its words, in place. The old banner at the foot of the conversation and its wording ("Your connection dropped") are gone. The box clears the moment you send.
- **Try again sends once.** Before sending again it looks at who sent what and when (never the words, which stay out of the URL, a66) and compares the words on the phone. If the first try had in fact gone through and only the answer was lost, that is the message and nothing is sent a second time.
- **Pam in Messages.** The row "Pam" with Pam's mark, first line the welcome, is always on top for a signed-in person while `pam_messaging_live` is on. It reads like any other conversation: no pinned card, no "who reads this", no crisis text in the thread, no ⋯, no Report or Block. A document cannot be sent to Pam ("Send a photo."); photos and the microphone stay.
- **The welcome and the out-of-hours reply have no author.** The words are drawn in the reader's language from `system_key` (D-606), by `lib/pamMessages.ts`.
- **A limited account can write to Pam** and only to Pam.
- **A fixed address, `/messages/pam/`** (Mira, 18 October): signed in, it asks `open_pam_conversation()` and opens the thread; signed out, Sign in and back (`/signin/?next=/messages/pam/`, added to the allow-list for every role but the super admin); switch off, or a super admin: Messages. Help's last row "Write to Pam" and Contact Pam use it.
- **`pam_inbox()` lists only conversations somebody wrote in** (migration `20261018080342`, Ava's point): a welcome alone is not a conversation the team has to answer, and the client is not sent a row per account.

## What this changes

D-511 (Contact Pam / Help as the way to reach Pam by email form) stays for a signed-out visitor; signed in, both go to the conversation. The old per-conversation "connection dropped" notice (D-427's neighbours) is replaced by the per-message state.

## What a later session might reverse

- "Sent" under the last message only; a delivered/read receipt is a different thing and was not asked for.
- `?pam=1` on the thread address still exists for the stories; `/messages/pam/` is the address to link to.

**Proof:** `message-pam.spec.ts` (17 cases × 3 projects, seven languages at 320); `messages.spec.ts` (failed send stays; Try again once; Try again after a send that had landed sends no second copy); `signinNext.test.ts`; DB tests 81 and 82; Storybook `States/Message Pam` (row, welcome, outside hours, not sent) through the language-fit audit.
