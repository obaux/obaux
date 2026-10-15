# 2026-10-15 — messages answer by text context

**Branch:** `claude/messages-answer-by-text-context` · **Lane:** Messages & notifications (Nico)

## What changed

Answer by text (`/reply/`) shows who wrote and what they asked (D-583, Iris's W3): the first name if Pam knows the number (new super-admin-only RPC `profile_first_name_for_phone`, migration `20261015144245`, test 74), the number as a person reads it, and the words and time from the link's `#` fragment (`lib/replyContext.ts`). Nothing new stored. Two new strings in seven languages (drafts). Stories: `super-admin-screens--answer-by-text` enriched, `…-unknown-number` added; Storybook fixtures; e2e `answer-by-text.spec.ts`; `support-reply.spec.ts` now expects the number as a person reads it.

## What was wrong, and what missed it

## Decisions made

## Verified

Web tsc, web unit tests 183, config tests 1311 (the copy-sync-cli test failed once under load and passed on a quiet rerun), ui tests 124, DB suite all green, fit audit on the story 0 findings, Storybook builds, full e2e 1868 passed with only the expected `support-reply` change failing (fixed, rerun green with Messages specs: 264 passed).

## Left undone

- The email link: when answering by text is turned on, help-request must put the words after `#` (D-583). Not built (a61 is off).
- Sage signs the two strings, Lena the translations.
- The name lookup is a new capability for the super admin: Mira and Will to confirm.

## Needs a human
