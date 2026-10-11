# 2026-10-11 — website: search that infers what people mean

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Public website (Wren), with Sage (the synonym list and the Most asked list)

## What changed

- `lib/search.ts`: accents folded; typo correction (edit distance 1 for 4–7 letters, 2 for 8+, on the word as written, then on the stem); everyday-word expansion; `suggest()` (likely questions as you type), `didYouMean()`, `asQuestion()` (apostrophes and a capital back for a phrase people typed).
- New `content/search-synonyms.ts` (Sage's list; I seeded 18 groups) and `content/most-asked.ts`.
- `SupportScreen`: the app's `SearchPill` (combobox) instead of the plain box; "Did you mean:" buttons; a "Most asked" list on the front page.
- `globals.css`: the suggestion list stays inside the screen and wraps.
- Tests, a11y script (combobox role), four Storybook stories.
- Carried from earlier on this branch: the three help posts (a51), the case-managers line (a50), the parked gap.

## What was wrong, and what missed it

- A listbox with no options (no known question starts the way you typed) failed axe (`aria-required-children`, critical) on every "searching" scan. Only the a11y script caught it; unit tests do not render the dropdown. The row "Search for “…”" fixes it.
- The first suggestion list was 521px wide on a 390px phone, its text cut off. No test measures it; I looked at a screenshot. The `globals.css` rule fixes it. Worth a measurement in the a11y script.
- A typo broke the word ending before stemming ("sining" -> "sin"), so it could not be corrected. Fixed by correcting the written word first.
- Counting both the typo and its correction made a phrase match score below its threshold. Fixed by scoring the corrected words only.

## Decisions made

D-507.

## Verified

| Check | Result |
|---|---|
| `@pam/site` tests | 53 passed |
| Typechecks `@pam/site`, `@pam/web` | pass |
| Site a11y (axe) | 105 scans, 0 problems |
| Built site in a browser | suggestions after "why didn": 5 rows of 56px; Enter picks; "invte" finds Sending an invite; "probation" gives "Did you mean"; the list fits at 320, 390 and 1440; Most asked shows 6 |

## Left undone

- Item 5 (learning from misses): the merge desk takes a design to Will first.
- Sage's review of the synonym groups and the Most asked list.
- The suggestion list is not read out to a screen reader as results arrive beyond what the Astryx combobox does.

## Needs a human

Will: the pill look on the site's search box.
