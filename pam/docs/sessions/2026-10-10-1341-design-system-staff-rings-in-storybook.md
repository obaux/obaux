# 2026-10-10 — Design system & Storybook (Dot): the people rings on the redesigned staff Homes

**Branch:** `claude/pam-design-staff-rings` · **Lane:** Design system & Storybook

Job 2b from Mira: build the new-design staff Home with D-198's row of rings (rings on anyone with something
new, those first), as stories for the case manager and the program lead, with no route, from the old Home's
data (`people_activity`), no new words. D-477.

## What changed

- `lib/useRankedPeople.ts` (the old Home's ranking, moved out of `HomePeople`, which now calls it),
  `lib/exampleRankedPeople.ts` (the example people, shared with the preview strip), `screens/StaffPeopleRow.tsx`.
- `PeopleHomeView` gets a `strip` slot, `ScheduleView` an `above` slot; `CaseloadHome` and `ProgramHome` use them.
- `HomePeopleSection` exports `toStripPeople` (where a tap goes).
- Stories: Case manager › States › Home (+ Arabic), new Program lead › States › Home with people (rings,
  Spanish, Arabic). Mock: the caseload is who a case manager or lead may message; Tanya saved a place.

## What was wrong, and what missed it

- **The row first showed the example people beside a two-person list** (Aaliyah, Keisha, Jordan... above
  Marcus and Tanya): the mock returned nobody from `messageable_people`, so the row fell back to the example
  set while the list was the mock caseload. Only the screenshot showed it. A story whose row and list
  disagree misleads a reviewer about what the screen does; the mock now makes them one set.
- **A ring in a story would have disappeared on the second look.** "Since you last looked" is kept per browser,
  so a fixed save time ages out of newness after one view. The mock's save is a minute in the future.

## Decisions made

- D-477 (above): everyone on the list, lit first, as the old strip; no heading; routed nowhere.

## Verified

| Check | Result |
|---|---|
| `tsc`, web unit tests, web build, first-load budget | clean; 76 pass; 24.7 kB to spare |
| `e2e/people-strip.spec.ts` (old Home, refactored onto the shared hook) | 15/15 on three projects |
| `audit:fit --match home`, 7 languages + pseudo at 320px, `--known` | nothing new in the staff Home stories; 12 not accepted, all the old Home's peeking saved card (accepted in D-467's list, not on `main` yet) |
| axe on Case manager Home (en, es, ar) and Program lead Home with people (en, ar), light and dark, 320 and 390 | no violations (colour contrast included, in a real browser) |
| Screenshots, light English and Arabic | looked at: row under the count, mirrored in Arabic, Tanya's ring first |
| Full Playwright suite | not run: not routed, one spec file is the only e2e touching what I changed |

## Left undone

- **Not routed.** Staff stay on the old Home until Will answers (card a22).
- The message-ring variant is only in the Program lead story (example people); the case manager story's mock
  lights a save. A mock thread with a member of the caseload would show both.
- The user-flow map: no screen was added to the app, so not updated.

## Needs a human

- Will: keep the rings or drop them (card a22). And whether the row should show everyone (as D-198) or only the
  people with something new.
