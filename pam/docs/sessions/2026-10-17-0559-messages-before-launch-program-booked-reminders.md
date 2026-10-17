# 2026-10-17 — messages before launch program booked reminders

**Branch:** `claude/messages-before-launch-program-booked-reminders` · **Lane:** Messages & notifications (Nico)

## What changed

Docs only (a94). `docs/before-launch.md`: a new item, widen the registered SMS campaign before `texts_live` goes on (what Will files, where, the count). `docs/sms-campaign-samples.md`: the campaign description now says "an appointment they or a program scheduled" (1,017 of 1,024 characters) with a note why; the consent screen's "things you plan" is flagged to Sage and Lena. No code, no strings changed.

## What was wrong, and what missed it

## Decisions made

## Verified

The description's length counted at 1,017 (cap 1,024); config tests run.

## Left undone

## Needs a human
