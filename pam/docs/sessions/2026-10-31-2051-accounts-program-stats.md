# 2026-10-31 — accounts program stats

**Branch:** `claude/pam-program-stats` (from `mira/b78` @ 0c820c27) · **Lane:** Accounts & invites

## What changed

- **Migration `20261031203225_…`** (expand only, not applied; the desk applies it):
  - `hours_are_real(jsonb)`, the same rule as `parseHours`; revoked from every client role.
  - `program_info_gaps(p_with_list)`: `security definer`, `search_path = public, extensions`, super admin only, no anon
    execute. It returns the counts (total; need/have for phone, website, address, hours; how many places lack something) and,
    when asked, the list of places that lack something (`id`, `name`, `address`, `kind`, `missing[]`).
  - It also adds the route `/places/missing/` to `app_error_routes`, in this migration rather than by editing the error log's.
- **Home** (super admin, `RequestsScreen` with `isHome`): `ProgramStats` shows a "Programs on Pam" card (Astryx `Card` and
  `MetadataList`) with the Parks & Rec note, then a "Missing information" row with its count.
- **`/places/missing/`** (`MissingInfoScreen`, D-213 nested page):
  - a search (`SearchField`, labelled, with Connect's signed "Search by name or address" as its hint);
  - `ChoiceChips` for what is missing and for the kind of place, and a live "N shown";
  - rows with the name, the kind, the address or "No address", and "Missing: …" (`Intl.ListFormat`);
  - each row opens `/place/?id=…&from=missing`. The place page got a `missing` back target.
  - The filters and search are kept in session storage for the visit.
- `useProgramGaps` (the hook, `readProgramGaps`, `filterGaps`), with unit tests.
- Storybook: `MissingInfo` and `MissingInfoNone` stories, the route, and a `program_info_gaps` fixture with Will's numbers.
- **Other lanes' files, touched minimally:**
  - `app/place/page.tsx`: one back target (places lane).
  - `packages/config/src/data-collected.ts`: the screen's one search field, "not personal" (Lena's privacy guard).
  - `appErrors.ts` and `test/app-errors.test.ts`: the new route. The test now also reads routes added by later migrations, as
    it already did for actions (Nico).

## What was wrong, and what missed it

Nothing was wrong before; this is new. Two things I found while building it:
- **New routes:** a screen added after the error log's migration had nowhere to declare itself. The test read only that file.
  It now reads later migrations too.
- **Arabic pictures:** with the English fallback, "331 of 588" reads "588 of 331" in a right-to-left row. The Arabic pictures
  are layout only until Lena's translations land.

## Decisions made

D-623.

## Verified

- DB: the full suite passes, including test 89's 29 checks:
  - `hours_are_real` matches `parseHours`;
  - the counts as the change made by nine places (inactive and removed ones left out);
  - Parks & Rec need only an address;
  - the list's rows and their shape;
  - signed out, a member, a case manager and a program lead are refused.
- Unit: `useProgramGaps.test.ts`, 8 tests; web unit 254 passed. tsc is clean. The bundle budget holds (1.7 kB spare).
- e2e `missing-info.spec.ts`, 11 tests × 3 projects, 33 passed:
  - Home counts and the row;
  - the list;
  - both filters together;
  - the search, including no match;
  - a row opens the place, and Back returns with the filter kept;
  - the empty state;
  - member, admin and provider refused with no call made;
  - axe on both pages.
- Config: the privacy guard and the app-error lists pass. The only failures are the translation checks on the 31 new keys,
  which clear once Lena translates them.
- Pictures: `docs/design/review/2026-10-31-program-stats/`, Home at 320 and 1280, and the page with a filter on and a search
  typed, each in English and Arabic.

## Left undone

- Sage signs the 31 new English lines (A29); Lena translates them. The Arabic pictures need reshooting after that.
- The Hours filter will hold nearly everything until real hours are filled in.

## Needs a human

Sage and Lena, for the words.
