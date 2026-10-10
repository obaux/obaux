# 2026-10-10 — Messages & notifications (Nico): staff's "What we would send" list

**Branch:** `claude/messages-staff-text-list` · **Lane:** Messages & notifications

Leftover from the promises review (Mira, 10 October): staff's list named texts nothing sends.

## What changed

- Text reminders for staff now lists what the four approved alert texts do and nothing else: a program lead
  gets a message waiting and a visit booked or changed (`reminders.what.messages`, rewritten
  `reminders.what.visits`); a case manager gets a message waiting and somebody on their list planning a visit
  (new `reminders.what.trips`). `reminders.what.staff1` ("introduced to your program") and `.staff2`
  ("something about your account changes") are removed from all seven languages and the code.
  Seven-language strings, ledger recorded.
- Before this the case manager's list did not match the Text alerts screen at all (it never listed a trip).

## What was wrong, and what missed it

- The list had been written before the texts existed and nothing tied it to the templates; the carrier
  screenshot is this screen, so a mismatch is a filing risk. The only tie now is this session's reading; a
  test that the screen's list matches the registered texts would be a good next check (not written).

## Verified

- Config 976 pass; `copy:status` in step; `tsc` clean in web; Storybook builds; fit audit on the reminder
  stories clean. Not run: Playwright (no spec reads the staff list; the build in `out/` predates this).

## Needs a human

- Nothing. (The "account changes" text, the staff request decision, is sent but arrives before a person ever
  sees this screen.)
