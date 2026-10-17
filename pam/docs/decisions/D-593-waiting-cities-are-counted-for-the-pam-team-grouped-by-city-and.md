# D-593 — Waiting cities are counted for the Pam team, grouped by city and state

**Date:** 2026-10-17 · **Branch:** `claude/pam-waiting-city-counts`

## Decided

Will signed card a96 on 17 October: "let's save the city and how many requests there are for that city. That is
important. We'll want that number as a reference to decide which cities to prioritize next."

- `waiting_city_counts()` (migration `20261017055932`) gives a super admin each city someone signed up from that
  Pam is not in, and how many people, biggest first. It returns a place and a number and nothing else: no person,
  phone, name, id or date. It is `security definer` (`set search_path = public, extensions`) and checks
  `is_super_admin()` inside. Anyone else, signed in or not, gets an error and no rows (test 75).
- The super admin's Home has a row, "Cities people are waiting for". Its number is everyone waiting, and it opens
  the list (`/cities/waiting/`). A row on the list cannot be tapped: there is no person behind it to open.
- Privacy what-we-keep.p16, signed by Will, already covers it: the cities are kept "so we know where to open next.
  Only the Pam team can see them."

## How a typed city is grouped

`waiting_cities` holds the city as the person typed it, one row per person.

- Spaces are trimmed at both ends and squeezed inside, and case is ignored. **"Camden", " camden " and "CAMDEN" are
  one place.**
- Whatever follows the first comma is the state, upper-cased. **"Camden, NJ" and "camden,nj" are one place, and it
  is a different place from "Camden" with no state.** A city given with no state is not guessed into one, because
  the same name can be in two states.
- State names are not matched to their letters: **"Camden, New Jersey" is a third place**, shown as "Camden, NEW
  JERSEY". If that splits a real city in two, the team adds the rows by eye. A table of state names can come later
  if the list shows it is needed.
- A place is shown as most people typed it. On a tie, the spelling in ordinary case wins ("Camden" over "CAMDEN").

## What a later session might change

- If states are written out often, match names to letters (New Jersey to NJ) before grouping.
- The counts include everyone who ever left a city, including people who later joined elsewhere. Will asked for
  "how many requests", and each request counts once per person (one row per person, a new city replaces the old).
