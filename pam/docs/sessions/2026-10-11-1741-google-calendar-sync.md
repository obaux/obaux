# 2026-10-11 — Google Calendar sync

**Branch:** `claude/places-programs-google-sync` (on the calendar link) · **Lane:** Places & programs (Piper)

## What changed

Migration `20261011174053`: `calendar_prefs` (the one place's-name setting, for the link and the sync), `google_connections` and `google_events` (RLS forced, deny-all policy, nothing granted), nine service-role-only functions, and `google_sync_kick()` on a 15-minute clock that does nothing when no one is connected. Edge function `google-calendar` (`handler.ts`, `google.ts`, `crypto.ts`, `event.ts`, `index.ts`): status, connect, callback, disconnect, sync. App: `useGoogleCalendar`, a Google section on the Calendar page (hidden until switched on), the place switch now serving both. 17 new strings (English in all seven files until signed). `docs/before-launch.md`: Will's checklist, no value in the repo.

Erasing an account queues a Google cleanup (D-539): the calendar is deleted and the token revoked on the next run, never holding up the erase.

## What was wrong, and what missed it

Nothing: Will asked for trips on members' calendars; the link is one half.

## Decisions made

D-539.

## Verified

DB test 62 and the whole DB suite (test 61 changed: the setting no longer needs a link). `google-calendar.test.ts` (21): off means off and touches nothing; one scope exactly, and more is refused and given back; forged, expired and missing state refused before Google is asked; the token sealed, never as it came; created, unchanged, changed, removed; discreet by default and the switch changes the events; the same words as the link; at most 100 writes; refused and deleted-calendar break the connection; five failed runs break it, one try per run; Disconnect always disconnects and tells what it could not do; the seal opens only with the key; nothing sensitive is logged. e2e `calendar-link.spec.ts` 36 (Google hidden until on; connect; connected; disconnect asks first; couldn't remove; broken; failed). Config 1137, web 142, tsc.

## Left undone

Not built, by decision: the finder. The scope name and what it permits must be confirmed against Google's own page (before-launch). Storybook/fit on this branch not yet run.

## Needs a human

Will: the Google Cloud project, consent screen, client and secrets (`docs/before-launch.md`), and the Privacy line. Merge desk: apply `20261011174053`, deploy `google-calendar` with JWT verification off.
