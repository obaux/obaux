# 2026-10-10 — Messages & notifications (Nico): the "reply START" sentence, ready and held

**Branch:** `claude/messages-reply-start` · **Lane:** Messages & notifications

Mira, 10 October: the Twilio receiver is on main but not deployed; the "reply START" sentence waits and
goes in the same release. Prepare it as a one-line change and name the branch.

## What changed

- `reminders.stopped.body` (shown under "Texts are off" on Text reminders and Text alerts) gains "To get
  texts again, reply START to a text from Pam." in all seven languages; ledger recorded.
- A changelog fragment.

## What was wrong, and what missed it

- Nothing. The sentence is true only once `sms-inbound` is deployed, `SMS_INBOUND=on` and Twilio's webhook
  points at it. Before that Twilio re-enables the number on START but Pam's stored STOP is not cleared.
  **Merge this branch in the same release as that switch-on, not before.**
- A START clears the stop and not the yes: somebody who never agreed to texts and replies START still gets
  none. The sentence says "to get texts again", which is true for the people who had them.

## Verified

- Config 976 pass; `copy:status` in step. No screen or story changed (a string).

## Left undone

- Staff's "What we would send" list (next, its own branch).
