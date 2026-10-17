# D-587 — The privacy guard: every field is listed with the Privacy line that covers it

**Date:** 2026-10-16 · **Branch:** `claude/lena-privacy-guard`

## What was decided

The Privacy page must not drift away from the app. A test (`packages/config/test/privacy-guard.test.ts`) reads the
app's source and a list (`packages/config/src/data-collected.ts`) together and fails when:

1. a file in `apps/web/src` or `packages/ui/src` has a field, a file picker, a signature pad, a microphone or a
   location request that the list does not know, or has a different number of them than the list says;
2. an entry names Privacy lines that no longer exist, or no longer say the words they were chosen for;
3. a kind of `TextField` (`FieldPurpose`) is not classified;
4. a component that collects but no screen uses (`VoiceInput`) is used by a screen before the page says what it
   would collect.

An entry whose Privacy line does not exist yet is an **open gap**: it is allowed, it names who decides ("For Will"
or the card), and it is shown by the list instead of hidden. A gap does not fail the build; it is the record that
the page does not say it. When a line is signed, the entry moves from `gap` to `covers`.

Will approved the idea on 10 October (a test listing every input that collects personal data with the privacy
line that covers it); the merge desk put it in the weekly notes of 16 October. The design was Lena's, in the READY
note of the three-sentences branch.

## Why a count per file

Reading the page against the code is judgment, and a test cannot make it. What a test can do is refuse to let a
field arrive without somebody saying, in writing, which line covers it. A count per file does that cheaply: add a
`TextField` to a screen and the count is wrong, and the failure names the file and says what to answer. It does not
catch a second field in a file whose count somebody changes without thinking; it catches the usual case, a field
added and forgotten.

## What the first run found

Five things the page does not say (the entries with a `gap`), none of them new, all of them in the code today:

- **Last name and city.** Everyone, member or staff, is asked for a last name (optional) and a city (required) on
  About you, and both are written to the profile (`updateMyDetails`, `redeem_invite`). `what-we-keep.p1` names the
  first name, the phone number and the language. The held a84-h short form of `p7` names a last name and a city for
  staff only.
- **The "Text me when Pam opens in {city}" tick** (`join_waiting_city`): `texts.p1` covers the sign-in code and
  "reminders and updates about your account".
- **A report about a place** (reason, optional note, the person's account; super admins read it, D-585).
- **A staff member's own profile photo** (D-345).
- **A program's details** (a84 `sharing.p8`, already written and held).

Each is for Will to decide: the page is his signed text.

## Where the five stand (16 October, afternoon)

Drafted against the migrations and the code the same afternoon and signed for Will by Sage (A29, ledger `2430f52f`):
`what-we-keep.p1` (edited), new `p16` (a waiting city), `p17` (a report about a place), `p18` (a staff photo), and
`sharing.p8` widened. Checking them corrected three of the entries above:

- **Reports are read by every case manager as well as super admins** (`service_flags_select_admin = is_admin()`,
  0033; D-585 shows a case manager the reason and the note).
- **The tick promises a text nothing sends** (`waiting_cities` is read by nothing). The line ships with the tick removed.
- **"Only the Pam team can see" last name and city is true only after a migration** takes both columns out of the
  select grant for anon and authenticated (0075); today regional case managers, accepted buddies and public mentors
  can read them through the API, though no screen shows them.

Nothing deletes a report, a waiting-list row (until the account goes) or a staff photo; the photo line's last two
sentences wait for two builds. The entries stay `gap` until Will signs; then they move to `covers` with the keys above.

## What a later session might reverse

- The count per file is blunt; a finer check would read each field's `purpose` or label. Not worth it until the
  blunt one misses something.
- `VoiceInput` is dormant because no screen uses it. If a screen does, the page gets a line about speech
  recognition (the phone's or the browser's speech service hears the words) before the guard is told.
