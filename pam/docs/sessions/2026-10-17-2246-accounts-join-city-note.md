# 2026-10-17 — accounts join city note

**Branch:** `claude/pam-join-city-note` (off `main` 62ba50e4) · **Lane:** Accounts & invites (Ava)

## What changed

Iris's interaction run-through (`claude/research-interaction-run-through` @ ea2583f9, P5), relayed by Mira at 22:35: on
Sign up's "City you live in", "Pam is only in these cities for now." (`join.details.city.note`) was drawn as a 48px row in
the city list, like a choice, and tapping it did nothing.

- `JoinScreen.tsx`: the note is no longer an option. It was a disabled `__note` option after a divider, with its own
  `renderOption` and an `onChange` guard. It is now a `Text type="supporting"` under the `Dropdown`, in a `VStack gap={1}`.
  The list's options are the cities only, and `onChange` is plain `setCity`. `CITY_NOTE` is gone. No new words.
- The note now shows before the list is opened, which it never did before: someone sees it without having to open the
  list.
- Not touched: `packages/ui/src/Dropdown.tsx`, which Lena is changing for the language list. The note was never inside
  it; it was JoinScreen's options.

## What was wrong, and what missed it

- Nothing checked that every row in a list can be chosen. The new join.spec test does, for the city list.

## Decisions made

- Under the field, not Astryx's `description`. `description` sits between the label and the field, and Mira asked for
  under the list.
- No `aria-describedby`. Astryx's Selector sets its own and overwrites one passed in, and changing that means touching
  the shared Dropdown. The line comes straight after the field in reading order, so a screen reader reaches it next.

## Verified

- `tsc` clean.
- join.spec: 75 passed (25 tests × 3 projects), including the new one: the note is visible under the field; the open
  list has exactly one option, Philadelphia; no disabled option; the note is not in the listbox.
- The new test fails on main's JoinScreen (narrow-320: the note is hidden until the list is opened).
- e2e grep for anything counting the city list's rows: none. The only `getByRole('option')` uses are the language list
  (join.spec), Español (account.spec) and Programs (directory.spec).
- Full e2e: see the READY.
- Pictures at 320, before (`main`) and after, closed and open: `docs/design/review/2026-10-17-join-city-note/`.

## Left undone

- `stories/components/Dropdown.stories.tsx` still has an `OpenWithNote` story showing the old pattern, a note as a
  disabled row. It is in the shared Dropdown's stories, which may overlap Lena's language-list work, so I left it and
  told Mira.

## Needs a human

- Nothing.
