# 2026-10-18 — design explore bell and staff search

**Branch:** `claude/pam-design-explore-bell` · **Lane:** design system (Dot)

## What changed

- `HeaderBell`: `hideWhenEmpty` (used nowhere since D-565) became `hideWhenNothingNew`, keyed on unread (the example set's unread count where examples are on). `HeaderActions` takes `bellOnlyWhenNew`; a member's Explore passes it.
- `PeopleHomeView`: `SearchPill`/Typeahead replaced by `SearchField`; `onPick` and `search.none` removed; the empty state's Clear sets the query.
- Specs: `explore-bell` (a: none, b: only read, c: one unread), `explore-bell-shift` (first bell, and "nothing new" returns the held room), `case-manager-pass` (the field is a textbox; typing filters in place, no combobox or listbox).
- D-610, a changelog fragment.

## What was wrong, and what missed it

D-565 retired `/places/` and the bell's `hideWhenEmpty` with it; ExploreScreen never had the prop and `explore-bell.spec` lost its "nothing in the list" case, so nothing failed.

## Decisions made

D-610.

## Verified

- On main's real build (a worktree, `build:e2e`): (a) and (b) fail on `toHaveCount(0)` of the bell link; the new shift case and the staff-search cases fail too. Here: 24/24 bell specs, 18/18 case-manager-pass, 194 web unit tests, `tsc` clean.
- Pictures: `docs/design/review/2026-10-18-explore-bell/` (390 light and 320 dark; none, read, unread; staff typing).

## Left undone

- Job 3 (merge into `claude/pam-design-search-bar-look`, the bell rule on its SearchBar) waits for this to be on main.
- Unused i18n key for the retire sweep: `home.caseload.search.none`.

## Needs a human

Nothing.
