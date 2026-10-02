# 2026-10-01 — Storybook, journeys, and the member dock

**Phase:** 1 · branch `claude/pam-storybook` off `main` at `23cb190` (kept
apart from `claude/hopeful-thompson-07nj7n`, which waits on a DB-suite run
and a migration deploy)

## What changed

Will asked for a new workflow: front-end work shown in Storybook, updated
from these sessions, with journeys (whole screens) and the full app shell
there too. Hosted on Chromatic, his choice (D-208).

- **Storybook 10** (`@storybook/nextjs`) in `apps/web/.storybook/`: the
  app's providers, English/Spanish and light/dark toolbar switches, phone
  viewports, the a11y addon. `pnpm --filter @pam/web storybook` /
  `build-storybook`.
- **`.github/workflows/pam-storybook.yml`** publishes to Chromatic on every
  push touching `pam/**`; it skips itself until `CHROMATIC_PROJECT_TOKEN` is
  a repository secret.
- **Components:** a story file for every `@pam/ui` export (152 stories,
  each with a Spanish variant and its empty / long-name / error / loading /
  disabled states where it has them). Written by a subagent, checked here.
- **Journeys:** 19 screens × the roles that reach them (43 stories), real
  `page.tsx` components against a pretend Supabase (`journeys/fixtures.ts`,
  `mockSupabase.ts`) built from `scripts/journeys.mjs`'s data. Unmatched
  requests are answered empty and logged, never sent.
- **Shell:** `TabBar` (`@pam/ui/TabBar`, new — D-209), the five member
  tabs and Help in one dock, with `Shell/TabBar` and `Shell/Member app`
  (real screens inside the dock). Not mounted in the app.
- `pam/CLAUDE.md` gained a "Storybook is where front-end work is shown"
  section.

## What was wrong, and what missed it

**Every story first died on "`stylex.keyframes` must be compiled by
`@stylexjs/babel-plugin`".** `@storybook/nextjs` uses Babel only for a file
named exactly `.babelrc` or `babel.config.js` (read in its `preset.js`);
this app's is `.babelrc.js`, so it fell back to SWC. Fixed with a StyleX-only
Babel pre-step in `main.ts` that reads the app's own plugin options, rather
than renaming the app's config. Then confirmed by measuring a rendered
button, not by the build passing — the build passed while broken.

**`npx serve` makes Storybook look empty.** It rewrites `/iframe.html?id=…`
to `/iframe`, dropping the query, so every story said "No Preview". Use
`python3 -m http.server`. Written into CLAUDE.md.

**The first dock had 42px-wide tabs at 320px**, under §2.5's 48px. Help's
padding and the row's end padding paid for it; now 49×56.

## Decisions

- D-208 — Storybook/Chromatic as the review surface; what it is not (a
  deploy path; keystroke-live); the StyleX pre-step; journeys never touch
  the live project.
- D-209 — `TabBar`, from D-029/D-039; three open questions for Will.

Numbered from D-208 because `claude/hopeful-thompson-07nj7n` holds
D-204–D-207 and has not merged.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/web typecheck` | clean |
| `pnpm --filter @pam/config test` | 231 pass (incl. locale parity, with `tab.label`) |
| `pnpm --filter @pam/ui test` | 65 pass |
| `pnpm --filter @pam/web build` + budget | OK; 94.7 kB to spare — unchanged from `main` (`TabBar` is a subpath export, unmounted) |
| `build-storybook` | OK |
| Every story opened in Chromium at 375px | **205 stories, 0 page errors**, 0 unanswered Supabase calls (3 flagged by text match are `Notice` stories whose content is the error copy) |
| `BigButton` measured | 64px, `rgb(15, 88, 71)`, Figtree, 18px |
| `TabBar` measured | 320px: tabs 49×56, Help 64×48; 375px: tabs 61×56 |

Not run: the Playwright suite (no app code changed beyond the new,
unmounted `TabBar` and one locale key) and Chromatic itself (no token yet).

## Left undone

- Chromatic publishing needs Will's project token.
- The dock is not mounted; D-209's three questions decide how.
- Staff roles have no shell design.

## Needs a human

- Will: sign in at chromatic.com with GitHub, link `obaux/obaux`, and add
  the project token as the repository secret `CHROMATIC_PROJECT_TOKEN`.
- Will: where People and My Plan lead; whether per-screen Help comes off
  once the dock is in.

---

# Later the same day — the redesign starts with Profile (D-210)

Will sent three screenshots of a reference app's Profile and asked for PAM's
version: bottom navigation (Explore, Saved, Trips, Messages, Profile), a white
page with shadowed cards as a universal rule, a large title that shrinks on
scroll, notifications visible.

## What changed

- **Theme** (`apps/web/src/theme/pam.theme.ts`, rebuilt): white page in light
  mode; every default card 24px corners, no border, a two-layer shadow.
- **`@pam/ui`**: `LargeTitleHeader` (new), `ProfileCards` (`ProfileSummary`,
  `FeatureTile`, `FeatureTileRow`, `PromoCard` — new), `MenuList` (new),
  `TabBar` (rewritten to the five new tabs; Help out of the bar),
  `NotificationBell` gains `appearance="round"`, eight new icons.
- **`apps/web/src/screens/`**: `ProfileView`, `ConnectionsView`, `TripsView` —
  views taking props, not routes.
- **Stories**: `Redesign/Profile`, `Redesign/Connections`, `Redesign/Trips`;
  `Shell/TabBar` and `Shell/Member app` moved to the new bar.
- **Storybook preview**: the toolbar's dark switch now flips the whole page,
  not just the story — before, a dark story sat on a white page and light
  text on it vanished (every dark journey had this).
- 27 new locale keys, en and es.

## What was wrong, and what missed it

- **Tab icons came out at 16px** although drawn at 26: Astryx's tab icon slot
  sizes a bare SVG to its own box; only the Messages icon, already wrapped for
  its dot, escaped. Seen in a screenshot, then measured (26px each).
- **`Avatar` takes named sizes only**, despite its docs saying any number.
  Typecheck caught it.
- My first settings icon (a gear) read as a sun at 26px. Replaced with sliders.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | clean |
| `@pam/config` / `@pam/ui` tests | 231 / 65 pass |
| `pnpm --filter @pam/web build` + budget | OK, 94.0 kB to spare (was 94.7) |
| Playwright, full suite, on the white-page theme | **507 pass** |
| Every story opened in Chromium | **216, 0 errors** |
| Profile measured at 320px | tabs 62×64, icons 26px, menu rows 64px |

## Needs a human

- Will: the next screens' references (Explore, Saved, Messages), and a yes on
  the round bell replacing the filled one as screens move over (D-210).

---

## Addendum, later the same day — the journeys become clickable (D-211)

Will: "I can't click and preview the paths inside journeys … make it usable."

### What changed

- `apps/web/src/stories/prototype/`: `PrototypeApp` (in-story router — catches
  same-site link taps, takes `router.*` via Storybook's Next navigation mock,
  sets Next's pathname/search-param contexts per screen, Back stack, a
  "not in the prototype yet" screen for unknown paths), `routes.tsx`
  (`TODAY_ROUTES`, `REDESIGN_ROUTES`, `tabFor`), and six stories: Redesign —
  member; Today — member, case manager, program, super admin, not signed in.
- `apps/web/src/lib/navigate.ts`: leave-the-screen helper with a cancelable
  `pam:navigate` event. `NewMessagePicker` uses it instead of
  `window.location.assign`.

### What was wrong, and what missed it

- `asRole()` returns an untyped `StoryObj`; spreading it into a story typed
  by the Prototype meta failed typecheck. The helper now takes only the loader.
- My first click-through "failed" on Connections: the test clicked the
  Profile summary's "Connections" stat label (not a link) rather than the
  tile. The tile was fine — ClickableCard forwards a content tap to its own
  link with `anchor.click()`, which the prototype catches.

### Verified

| Check | Result |
|---|---|
| `@pam/web` typecheck | clean |
| `build-storybook` | OK |
| Click-through in Chromium, Redesign — member | Profile → Connections → Back → Explore → place (`?id=s1`) → Trips → Messages → thread (no tab bar) → Back; iframe URL never changes; no page errors |
| Today — member / not signed in | open on Home / Sign in; Saved reached by tap |
| Playwright, messages + directory (touches `navigate()`) | 90 pass |

### Left for next time

- Redesigned Explore/Saved/Messages views, once Will sends references —
  each joins `REDESIGN_ROUTES` with one line.

---

## Addendum — Explore, Home for staff, and the 404s (D-212)

Will: "I'm still getting 404 error, so I can't navigate on screens", then
Explore from an Airbnb reference (search first, clear + dropdown by name or
address, error and empty states, category chips), a caseload Home for case
managers and an interested-members Home for programs ("rename bottom nav
explore to home"), and "ignore size limits for this redesign".

### What changed

- **404s**: `journeys/journey.tsx` (was `.ts`) wraps every journey in
  `PrototypeApp` (new `first` prop: the story's own render until the first
  tap); `asRedesign` for redesign stories (redesign routes + bottom bar);
  `preview.tsx` cancels any unhandled same-site link. Redesign and
  `Shell/Member app` stories no longer draw their own fixed tab bar.
- **@pam/ui**: `SearchPill`, `CategoryChips` (new, with stories); six icons
  (all places, education, workforce, family services, offline, no results);
  `TabBar` gains `isHome` and a spacer so lists scroll clear of it.
- **apps/web/src/screens**: `ExploreView`, `ExploreScreen`, `PeopleHomeView`,
  `HomeScreen` (`CaseloadHome`, `ProgramHome`), `HeaderActions` (moved from
  stories, Help icon now 24px).
- `lib/usePlaces`: `searchPlaces()` for suggestions, `reload` for Try again.
  `lib/caseloadLabels` (moved out of `/admin/`). `/place/` accepts
  `from=explore`.
- Theme: the large `input-group` is the pill; `typeahead` lg draws nothing
  inside it; `globals.css` moves the focus ring onto the pill.
- Mock database: `services_near`/`services_search` honour category and the
  typed words (name or address), so search and its empty state work.
- 23 locale keys, en and es.

### What was wrong, and what missed it

- Edited `pam.theme.ts` without running `astryx theme build` — the pill had
  no shape until the generated CSS was rebuilt. Caught in a screenshot.
- The field sat in an `HStack` that would not stretch it; switched to a
  `VStack` slot. The global "ring the frame" rule ringed the Typeahead's
  inner box inside the pill; moved it to the pill.
- Ran Prettier with no config on `TabBar.tsx`: it rewrote every quote.
  Re-run with the repo's style; the diff is the change only.

### Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | clean |
| config / ui / web unit tests | 231 / 65 / 8 pass |
| `build-storybook` | OK; **242 stories, 0 page errors, 0 unanswered calls** |
| Click-through | Places journey → place → Back; Home journey → Places; component link stays put; case manager Home ↔ Profile; program → person; member Explore → place → Back to Explore |
| Search | "main" suggests by address; "broad" too; × empties it; "zzz" → nothing-matches state → Clear search; Work chip filters |
| Playwright: admin, place, places, a11y, area picker | **174 pass** |
| `@pam/web build` + budget | OK, 93.2 kB to spare (screens not routed yet) |

### Left for next time

- Saved and Messages references, then routing the redesign into the app.
- The suggestion dropdown is as wide as the field; wider would read better.

---

## Addendum — two templates, and the rest of the member app (D-213)

A run of references from Will, one after another, each folded in as it
arrived: nested-page template (Legal, Get help), Profile without Account,
Messages (frame, search, empty, plain rows), Trips (map + drawer, cards,
dock), Connections (photo cards + profile), What others can see (your data),
Saved (grid + Edit), the thread's ⋯ page, Explore fixes (chips aligned, "All
programs", smaller place cards with more padding, no call button in error
states).

### What changed

- **@pam/ui**: `SubPage`/`SubPageHeader`, `ConnectionCard`, `SavedGrid`,
  `TripCard`, `MapDrawer`; icons `BackArrowIcon`, `BookIcon`; `MenuList` gains
  `value`, `isSelected`, 18px labels; `PlaceCard` smaller type, 24px padding;
  `CategoryChips` no longer bleeds.
- **apps/web/src/screens**: `LegalView`, `LanguageView`, `HelpViews` (4),
  `PrivacyViews` (3), `ConnectionsView` (cards + profile) + `ConnectionsScreen`,
  `MessagesView`/`MessagesScreen`, `SavedView`, `TripsView` + `TripsMap`,
  `ThreadOptionsViews` (options, report); `ProfileView` menu reworked.
- **Real routes added**: `/legal/`, `/legal/privacy/` (+ `copy/`, `delete/`),
  `/language/`, `/help/topics/`, `/help/safety/`, `/help/report-place/`,
  `/connections/`, `/connections/person/`, `/messages/thread/options/`,
  `/messages/thread/report/`. **Changed in the app**: `/help/`,
  `/notifications/`, `/place/`, `/terms/`, `/privacy/`, `/messages/thread/`
  (template header; Report moved to ⋯).
- **@pam/config**: `dummy-connections`, `dummy-trips`; ~90 locale keys en/es.
- `lib/useChooseLanguage` (from `LanguageSwitcher`).

### What was wrong, and what missed it

- **The e2e suite tested a stale build.** `playwright.config` serves `out/`
  and reuses it; my first full run passed 507 against the 21:17 build, before
  any of this. A fresh `next build` showed 12 failures (4 tests × 3 widths),
  all the intended changes; tests updated (see D-213). Lesson: rebuild before
  trusting a local e2e run.
- `ListItem` draws its own (small) label size; `MenuList`'s row font size did
  not reach it. Fixed by passing the label as 18px `Text`.
- Trips pins: an `<a>` is inline, so the pin's column never formed; labels
  sat side by side and the left pin ran off-screen.
- Saved tiles: the rounded clip shaved the first letter of each subtitle.
- Photos and Google Maps could not be fetched from this sandbox (proxy denies
  both); neither is verified here.

### Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | clean |
| config / ui / web unit tests | 231 / 65 / 8 pass |
| Playwright, full suite, **fresh build** | **507 pass** |
| Storybook | 263 stories, 0 page errors, 0 unanswered calls |
| Clicked through | Saved Edit → × unsaves; Trips handle up/down, search "food" → 1 card; Messages search; thread ⋯ → Options → Report |
| Budget | 90.7 kB to spare |

### Needs a human

- A Google Maps **browser key** (Maps JavaScript API, restricted to PAM's
  domains) as `NEXT_PUBLIC_GOOGLE_MAPS_KEY` in Vercel — then check Trips.
- Real staff photos to replace the placeholders.

---

## Addendum, 2 October — quieter tab labels (D-214)

`TabBar`: labels 12px, regular weight, secondary grey; the current tab
primary at 600; icon-to-label gap 4px → 8px. Measured in Chromium at 375 and
320px: 64px tall, 73 / 62px wide. `@pam/ui` tests pass; Storybook builds.
