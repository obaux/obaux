# 2026-10-10 — messages alert texts wired

**Branch:** `claude/messages-alert-texts-wired` · **Lane:** Messages & notifications (Nico)

## What changed

- Migration `20261010134429_…` (expand): four per-kind switches on `notification_preferences`, a queue helper
  and three triggers (message written; visit planned/moved/cancelled).
- `AlertsView` and `useReminderConsent`: the four switches are live and stored per kind.
- DB test 42 (36 checks); `e2e/alerts.spec.ts` (6 tests); docs (`sms-campaign-samples.md`, `sms-setup.md`).

## What was wrong, and what missed it

Nothing queued texts 6–9, and the switches had nowhere to keep a choice per kind.

## Decisions made

D-478: per-kind columns (the screen's own note said this was the day); debounce rules.

## Verified

DB suite, DB test 42 alone; config tests twice; web unit; alerts, consent and back specs on three projects.

## Left undone

Someone-wants-to-connect and the member's own visit switch remain "coming soon". The trip text goes to
the case manager on record at the time. No text goes to a member when their own visit is changed by a program.

## Needs a human

Nothing.

## Addendum: held behind a flag

The merge desk held the branch: the switches would have let staff turn on real texts before go-live.
`ALERT_TEXTS_LIVE = false` in `apps/web/src/lib/alertTextsLive.ts`; held-state e2e tests pass, live-path tests
pass with the flag temporarily true (18/18, twice) and are skipped while it is false; `alert-texts-live.test.ts`
ties it to the site's `VISIT_REMINDERS_LIVE`; runbook step 7 flips it with reply-start.
