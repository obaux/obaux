# D-477 — The staff Homes carry the people rings in their own row, not routed yet

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-staff-rings`

Card a22: Mira recommends Will keep D-198's rings, the strip that shows a case manager or a program lead
which people have something new. Until Will answers, staff keep the old Home (D-456). Mira asked for the
redesigned staff Homes to carry the rings anyway, in Storybook only, so that "keep" is a small step and
"drop" loses nothing. This is that build; nothing is wired.

## What was decided

- **A row of rings under the Home's title, above its list or calendar** (`StaffPeopleRow`, drawn by the same
  `PeopleStrip` as the old Home). A case manager's row sits under "Your members" and the count; a program lead's
  between the header and the calendar (and above the getting-started cards when nobody has booked).
  Hidden while searching.
- **Everyone on the list, lit people first**, exactly the old strip's rule (`rankPeople`): not only the lit
  ones. The list below is the same people; a row of lit people alone would be a shorter list above the list, and
  it would change what D-198 means. If Will would rather the row show only who has something new, it is one
  `filter` in `StaffPeopleRow`.
- **No heading and no "see all"**: the title says whose they are and the list is on the screen. The row keeps
  its accessible name (the old heading's words), and a lit ring says why to a screen reader ("New message",
  "Saved a new place"). No new words: the old Home's keys only.
- **One source, one ranking.** The old Home's data (`messageable_people`, the conversations, `people_activity`,
  and when this account last looked) moved into `useRankedPeople`, which `HomePeople` (old Home) now also
  calls, so the two cannot rank differently. The example people (a real account with nobody on its list, a super
  admin's preview) are `exampleRankedPeople`, shared with the old preview strip.
- **Stories:** Case manager › States › Home (rings on Tanya, who saved a place), and Program lead › States ›
  Home with people (the example people: an unread message, a new save). The Storybook mock now returns the
  caseload as the people a case manager or lead may message, and a save for Tanya a minute from now (so the
  ring survives "since you last looked" being kept per browser).

## What a later session might want to reverse

- If Will says drop: delete `StaffPeopleRow`, the `above` slot on `ScheduleView` and the `strip` slot on
  `PeopleHomeView`, and the two story files' mentions. `useRankedPeople` stays (the old Home uses it) until the
  old Home goes.
- If Will says keep: switch the staff to the redesigned Homes in `HomeScreen` (the people-strip e2e specs then
  move with them; they are written against the old Home today).
