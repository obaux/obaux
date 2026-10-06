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

## Addendum, 2 October — red current tab (D-215)

`TabBar`: current tab icon, label and avatar ring red (#E31C5F light, 4.6:1;
#FF6B86 dark, 6.3:1 — the mockups' #FF385C fails AA at 12px). Astryx's
selected underline hidden through the theme (`tab-indicator` sets
`--color-accent: transparent`; an `opacity` override lost to the component's
own rule — first attempt, caught in a screenshot). Checked light and dark in
Chromium.


## Addendum — 2 October: search, header buttons, help (D-216)

- Trips and Messages search use `SearchField`, matching Explore's pill.
- Round header buttons (bell, Help, search, Edit) are ghost buttons with a
  white ground and a 1px grey border.
- Your safety explains ⋯ → Report suspicious activity; Help's topic and
  safety pages use the Call PAM row instead of a big button.
- "Find the place" goes to Explore; `/places/` shows Explore in the
  redesign prototype.
- Checked: `pnpm -r typecheck`, UI/config unit tests, `build-storybook`,
  a fresh `build`, then a11y + messages e2e (105 passed).

## Addendum — 2 October: only the redesign, a folder per role (D-217)

- Storybook: `Member app` / `Case manager` / `Program lead` / `Super admin`,
  each `Prototype` + `Screens` + `States`; old journeys, `Shell/Member app`
  and the "Today" prototypes deleted. `roles/screen.tsx` builds a story from
  the route table. `asRole` always uses the redesign routes.
- App: Report a place, Points, person, Everyone, Staff requests, Interested,
  `/admin/` (Invite someone), Text reminders, Sign in (code step) and the
  sign-up step header moved onto the templates; `HelpButton` replaces the
  Help bar on them and on a place.
- New: `ProfileScreen` (session-aware; staff rows), `ViewAsView` + `/view-as/`.
- Left alone: the old `/`, `/places/`, `/saved/`, `/messages/`, `/account/`
  pages still ship in the app until the tab screens are routed; Storybook
  never shows them.
- Checked: typecheck, UI/config tests (296), `build-storybook` (264 stories,
  0 render errors), bundle budget (90 kB to spare), full e2e on a fresh
  build: 15 failures across 5 tests, all from intended changes (Points no
  longer has the app header's account button; `/admin/` has no bell; the
  Everyone filter left the header; a closed door still names the screen;
  Report a place leads to Explore). Tests updated; those specs 129/129.

## Addendum — 2 October: the Google Maps key

- Will created a Maps JavaScript API browser key; it is set in Vercel as
  `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (all three environments) — not in the repo.
- `/trips/` added as a real route so a deployment shows the map.
- `TripsMap`: redraws only when the pins change (it rebuilt the map on every
  render), and falls back to the drawn preview when Google fails or refuses
  the key (`gm_authFailure`), instead of a blank area.
- Verified: Google serves the Maps script for the key (HTTP 200 with the
  preview's referrer). The sandbox browser cannot reach Google through the
  proxy, so the drawn map was what it showed — the fallback working.

## Addendum — 2 October: staff apps (D-218)

- Role bars (`lib/tabs.ts`), `FloatingAction`, `/invite/` (`InviteView`),
  starred people (`useStarredPeople`, session only; star on rows and on a
  member's page; Saved People | Programs), program lead schedule
  (`ScheduleView`, `dummy-appointments`), Program tab (`ProgramView`), All
  programs (`ExploreScreen mode="programs"`) and Add a program
  (`AddProgramView`, reusing `ProgramDetailsStep` with `submitLabel`).
- Sign out row centred (`globals.css`, `.astryx-item > button`).
- A fixed element inside `Page` is pinned to the page's motion wrapper, not
  the viewport — the floating row rendered mid-page until it was moved
  outside `Page`. Worth remembering for any future floating control.
- Checked: typecheck, UI/config tests, `build-storybook` (276 stories, 0
  render errors), bundle budget (88 kB to spare), screenshots of each new
  screen.

## Addendum — 2 October: program leads invite (D-219)

- Migration 0070 (`create_invite` for program leads; member invites land on
  no caseload) + `test/08_program_invites_test.sql`; full DB suite passes.
- Live: `list_migrations` checked first (live at 0067, no unknown live
  migrations; 0068/0069 held back on `claude/hopeful-thompson-07nj7n`, and
  they do not touch `create_invite`). Applied 0070; `get_advisors` shows only
  the standing notices.
- InviteView makes real codes for program leads; the not-yet note and its
  strings are gone. Starred people stay session-only (Will).
- Month view: full-width `MonthGrid` replaces Astryx Calendar; shared header
  row for Day / Week / Month.
- D-220: list rows shrink so previews truncate (`globals.css`); Messages has
  a green New message button (opens the D-186 picker) instead of Help.
- D-221: ScheduleView on the tab template (search button → field + Cancel,
  bell, `AddMenu` +). D-222: `useHideOnScroll` hides Explore's search row
  (sticky `top` offset). D-223: Your safety redesigned (card + two rows).
- D-224: `PlaceBarActions` (Save + ⋯), `PlaceDetail` quick actions, hours
  link in the hours card; member Saved shows Edit only.
- D-225: Trips + only; `NewTripView` (`/trips/new/`), `addedTrips` session
  store merged into Trips; preview map de-duplicates pins.
- D-226: `FloatingAction` is a flat strip on the bar; CM Profile has Invite someone again.
- D-227: compact `PersonRow` + message shortcut on CM Home; `/person/` profile card with star, trips (`dummyTripsFor`), real caseload members from `useCaseload` only.

## Addendum — 3 October: polish (D-228)

- `NewMessagePicker` uses `SearchField` (the Home pill), inset from the sheet edges.
- `PlaceDetail` quick-action labels 14px → 12px.
- `SavedGrid`: tile link `overflow: visible`, so the picture's shadow is no longer clipped.
- Checked: typecheck, `build-storybook`, screenshots of Saved, Place and the picker.
- D-229: picker title and role labels (`pickerContextFor`); avatars aligned with the search icon; `SearchField isSubtle`; sheet handle styled like MapDrawer's (`globals.css`); `CategoryChips` `tone`. The Messages e2e now finds the sheet by its new name, "New message" (60/60).
- D-230: `MapDrawer` handle overlays the header plus a sticky fade; `TripCard` one-line 17px name and 14px art radius; `NotificationList` New/Earlier sections with icon, title (`notify.kind.*`) and dot. e2e admin, messages and people-strip: 129/129.
- D-231: `/person/` uses `ProfileSummary` (new `corner`) and `MenuList` rows (new `badge`); `DummyConversation.unreadCount`; new `/person/connect/` (`ConnectView`) plus stories (CM "A member with new messages", "Connect a member to a program"); bell only in the header. The UI unit test for new notifications now looks for the dot (D-230 broke it on a05ffa3; fixed here). Full e2e 507/507; config 231, ui 66, web 8.
- D-232: `.astryx-bottom-sheet` top corners 28px (measured in Storybook).
- D-233: `LargeTitleHeader titleAccessory`; Saved switch on the title line; segmented controls are pills (`globals.css`). e2e saved, admin and people-strip: 93/93.
- D-234: member page order and past trips (`/person/past/`, `PastTripsView`, `usePersonName`); `open_direct_conversation` fixture; Connect with search, round checks and a confirm dialog (32px, 80% white backdrop).
- D-235: place `primaryAction` (Schedule a visit) and a Directions circle; Plan a trip (search, dividers, View all places, step-wise back via `SubPageHeader onBack`, pill choices); thread Options shows program details only for program threads. Checked: typecheck, Storybook screenshots and click-through, place e2e 24/24 after updating it for Directions / Schedule a visit. The final full re-run was stopped at Will's request; CI will run it.
- D-236: `ConnectView` laid out like Explore (search button that swaps the top, sticky `CategoryChips` with a fade, `PlaceCard action` checks at 48x48); `ScheduleView` count under the date, fixed height. Checked: typecheck, Storybook screenshots (top, scrolled, search), nav position measured in all views; ui and config unit tests.
- D-237: "Programs in PAM" row for program leads; no Save for program leads (cards and place bar). e2e place, places, saved and account: 102/102.
- D-238: programs screen search as a round button that swaps in the pill and Cancel. e2e places: 57/57.
- D-239: BigButton 56px / 17px; invite lists use `BigButton variant="secondary"`; tokens, a11y test, CLAUDE.md rule, SOP amendment A16.
- D-240: `SuccessScreen` (centred, confetti from the data palette, reduced-motion safe) used for Connect's done state; story `Components/SuccessScreen`. Checked: typecheck, ui and config tests, screenshots during and after the confetti.
- D-241: New trip → `/trips/?added=` (drawer full, `Confetti`, arriving card); done step removed. Checked: build, Storybook walk-through screenshots, ui tests, e2e place and a11y: 69/69.
- D-242: program-lead view of `/person/` (program-only stats and Visits with you; no trips, past or saved); transparency contract and copy changed first (`canSee.lastActive`, `cannotSee.programActivity` removed); db test 04 comments updated, its assertion unchanged (the DB is still stricter). **Open: migration to expose last_active to programs, with Will's go-ahead; tell members first.**
- D-243: `/person/saved/` (`SavedByView`) plus a row; "Programs attended in the past". Checked: build, config tests, e2e consent, join, directory, people-strip, admin and account: 204/204; screenshots.
- D-244: week/month totals under the date; month list 32px from the grid, 56px rows (measured).
- D-245: `TabBar homeIcon` (people / calendar); quick actions in 25% slots, left-aligned; Next visit stat with time. Screenshots checked.
- D-246: `MessagesView floating`; member's "My connections" → `/connections/`. e2e messages re-run.
- D-247: Plan a trip search → Explore; "Plan a trip" on a place. e2e place re-run.
- D-248: `SignInScreen` (+ `preview`), `PrototypeSignIn`, Sign in story per role prototype; verified each lands on its Home. e2e consent and join: 123/123.
- D-249: each role's Prototype starts at Sign in and runs that role's onboarding (`JoinScreen` + `preview`, `usePreviewSignIn`, `PrototypeJoin`, route `/prototype/join/`); Sign in and member "Not signed in" stories removed; super admin goes Sign in → Home. Verified by a scripted walk-through to Home for member, program lead and case manager.
- D-250: Privacy/Terms opened from Sign in or joining go Back there (`?from=`, `goBack()` + `pam:back` in the prototype). Checked: typecheck, web build, Storybook walk-through, config tests, e2e join, consent, legal and a11y: 156/156, plus 2 new legal tests.
- D-251: `CodeBoxes` (one field under six boxes; paste-safe; auto-submits), code step without a card on `/signin/` and `/join/`, joining on `SubPageHeader` with step subtitle and per-step back (`backHref` now optional), `LegalFooter` pinned outside `Page`; StepHeader story removed, CodeBoxes story added. Found and fixed on the way: `maxLength` truncated pastes; a fixed footer inside `Page` didn't stick (transform). Checked: typecheck, ui tests 66/66, config tests, web build, Storybook walk-through of all three onboardings to Home plus Back from the code step, e2e join, consent, legal, a11y: 162/162, then consent 54/54 with the new test.
- D-252: code step order: boxes and button under the title, then the step and "Sent to … Send again". Checked: typecheck, Storybook screenshot, e2e join and consent.
- D-253: step back as subtitle (D-252 undone); Prototype = sign in only (`PrototypeSignIn` with code step), `Onboarding` stories per role; Sent to / Send again centred and stacked; Sign in code step left-aligned; slide 1 scrim 0.2; globe as white disc; `--_button-radius: 999px` + BigButton pill. Checked: typecheck, ui tests 66/66, Storybook screenshots (sign in, both code steps, profile, place), onboarding walk-throughs to Home for all three roles, e2e join, consent, legal, a11y, place, theme: 198/198.
- D-254: invite links (`inviteLink`/`readInvite`/`rememberInvite` in `lib/appUrl.ts`; `/signin/?invite=&as=`), Sign in invite line + role slides, join picks up the invite (no code field, no fit question), shared `InviteReady` with Send the link, CM/PL Prototypes and Onboarding start at the invite Sign in. Checked: typecheck, web unit 9/9, config 231/231, Storybook walk-throughs (CM and PL onboarding to Home), e2e join, consent, a11y, admin, directory, legal: 261/261 after updating the admin invite test. Open: early expired-link check needs a migration (Will).
- D-255: Saved Edit (staged removals, primary Done, `useLeaveGuard`, `ConfirmDialog`), ringed stars in People edit, unstar always confirms (`StarToggle name`), CM Saved top right = Edit only. Found and fixed: primary Done was white-on-white (quiet style still applied). Checked: typecheck, Storybook click-through (unstar modal, staged people, switch modal, Put back, programs staged, tab-bar leave modal, Done), e2e saved, a11y, account, people-strip, directory, join, consent.
- D-256: staff Profile card is text alerts; CM `/reminders/` lists messages first; programs get `/alerts/` (`AlertsView`, three switches, PAM-sized labels, own STOP/HELP line); story `Program lead/Screens/Text alerts`. Sign in reads invites in an effect (Suspense remount fixed). Checked: typecheck, config 231/231, Storybook screenshots, e2e a11y, consent, join, account, legal, admin, saved: 282/282. Open: per-kind column and SMS templates need Will.
- D-257: super admin Home = `RequestsScreen isHome`; `/requests/` wraps it; super admin tabs Home/Messages/Profile; All programs on their Profile; RoleSwitch white disc. Checked: typecheck, ui 66/66, Storybook prototype (sign in to Requests Home, Profile row), e2e requests-adjacent suites: 186/186 + 102/102.
- D-258: `InvitePhoneStep` on all three invite screens; migration 0071 (14-day default, `invite_preview`, `request_invite_renewal`, `invite_renewals_pending`, `decide_invite_renewal`) + DB test 09, **not deployed** (0068/0069 drift); `/invite/expired/` (`InviteExpiredScreen`); Requests "Expired invite links"; fixtures and Onboarding/Expired link story; `docs/changing-the-domain.md`. Checked: DB suite all passed, typecheck, Storybook screenshots, e2e admin, account, consent, join, a11y: 222/222 + expired-link test.
- D-259: `/about/` (`AboutScreen`), `OnboardingSlides variant="inline"`, footer About PAM, `readAudience` + Sign in `audience`, prototype `/signin/` → stand-in; story Onboarding/About PAM. Checked: typecheck, Storybook click-through (footer → About → Case managers → Sign in as a case manager shows their slides), e2e consent, legal, a11y, join: 180/180.
- D-260: `AlertsView` per role (CM: message, trip; member: visit, message, connect, closed), `GLOSSARY` + `TermInfo`, Profile card/row to `/alerts/` (member first yes still `/reminders/`); stories CM/Member Text alerts. Checked: typecheck, config tests, Storybook screenshots (CM with trip popover open, member), e2e account + a11y.
- D-261: `dummy-policies`, `usePolicies`, `PoliciesScreen`/`PolicyScreen` (`/program/policies/`, `/view/`), `VerifiedBadge` (person page) and a static tick in schedule rows, Program profile row, `ProfileSummary nameAddon`; stories Program lead/Policies, A policy. Checked: typecheck, ui/config tests, Storybook click-through (list, edit-remove with confirm, preview/signed, badge popover, week ticks), e2e a11y + people-strip. Open: storage, member signing screen, transparency line.
- D-262: `RequestProgramScreen` (`/requests/program/?id=`); request cards show the program row and Text {name} (`staff_request_phone`). Migration 0072 (super admin ↔ staff in `can_message`, `messageable_people`, `open_direct_conversation`; `staff_request_phone`) + DB test 10, 05 counts by role, runner glob widened; **0072 not deployed**. Super admin messaging in `MessagesScreen` and the thread page, Robin (`DUMMY_PAM_TEAM`) and a Teresa thread, "PAM team" label, slot-by-self example threads. Found and fixed: the example conversation fixture gave the super admin a thread with a member; links on the card read as indented plain text, so they are now a row and a pill. Checked: DB suite all passed, typecheck, Storybook screenshots (Home, program page, Messages, thread, CM Messages), e2e admin, directory, messages, a11y, account, people-strip: 234/234.
- D-263: phone step removed (InviteView, admin, directory, useCaseload, admin/account e2e back to pre-D-258; `InvitePhoneStep` and its keys deleted). 0071 rewritten in place (not deployed): 30-day default kept, `request_invite_link` (new invite plus `invite_emails` outbox, code never returned, one per link), `invites_log()`; renewal queue removed. DB test 09 rewritten. Expired page asks for email only (`TextField purpose="email"`). `InvitesLogScreen` (`/invites/`) floating on the super admin Home. `@pam/config/invite-email` (draft, `reviewedBy` empty) plus test and story. Sign in OG/Twitter tags and `public/og/invite.jpg`, `public/email/pam-logo.png`. Found and fixed: the floating row sat inside `Page`'s transform and floated mid-screen; the OG PNG was 554 KB, so it is now a 72 KB JPEG. Checked: DB suite all passed, config 236/236, ui tests, typecheck, web build (OG tags in `out/signin`), Storybook screenshots (Home, log, expired and sent, email en/es, Invite someone), e2e admin, account, consent, directory, a11y, join, legal, people-strip: 306/306. Open: email provider and sender, and copy review (Will).

- D-264: deployed 0071 and 0072 to the live project (`list_migrations` first, no drift; 0063 functions matched; advisors no new kind; anon spot check). 0068/0069 left undeployed: other branch, and 0069's `can_message` would undo 0072. Invite email `reviewedBy` set (approved); test flipped. `docs/before-launch.md` created (email provider first). User-flow map: `docs/user-flows/flows.mjs`, `scripts/user-flows.mjs` (screenshots plus HTML plus layout), `scripts/user-flows-figma.mjs` (Plugin API scripts); Figma file "PAM — User flows" in Oba Studio, drawn with `use_figma` because `mcp.figma.com` (HTML import and asset upload) is blocked by the network policy. Skill `.claude/skills/pam-user-flows`; CLAUDE.md lists both standing lists. Checked: config 236/236, generated pages reviewed as screenshots (sign in, member, case manager, super admin, overview).
- D-263 follow-up: the invite link picture is lighter: an 8% veil and a shade behind the words instead of a 45% overlay (Will: "less dark"). Checked by eye.
- D-264 map: drawn in Figma (overview plus five flow pages, 64 screens, 47 arrows). Screen slots link to Storybook; screenshots wait for `mcp.figma.com` (Will: wait). The inline-base64 route failed and was removed from the generator and the skill. Checked: `get_screenshot` of Sign in and Super admin.
- D-265: `SearchLauncher` and `SearchPill hasAutoFocus`; member Explore uses the launcher, then the pill with Cancel; no `HeaderActions` for a member. `NextTripCard` (+ story) with the soonest `DUMMY_TRIPS`. Bold search text, placeholder and icon via `globals.css` (large input group). Chips 40px with a 48px `::before` tap area. Checked: typecheck, Storybook screenshots (Explore at rest and searching, case manager Home).
- D-266: Sign in card flat under the slides (`isFlat`, no overlap); code step 20px inset (buttons 320/318px measured). Checked: typecheck, prototype screenshots, web build, e2e consent, join, a11y, legal, places, messages, saved, theme: 300/300. Map: flows.mjs updated (Explore D-265; Sign in and code D-266).
- D-267: connections subtitle (`FloatingAction description`), invite member subtitle, `ScheduleView` week default, chip row runs to the screen edge. Checked: typecheck, Storybook screenshots (Explore chips, Messages, Invite someone, program lead Home), web build, e2e a11y, places, messages, admin, people-strip: 201/201. Map: program lead Home marked D-267.
- D-268: Trips pins (black disc with a tip and a white icon, 40px; Google `PIN_SVG`), `NewTripButton` as a light top-centre pill. Checked: typecheck, Storybook screenshot, web build, e2e place and a11y: 69/69. Map: member Trips marked D-268.
- D-265 follow-up: the launcher was 48px and the open pill 60px; set `height: 60px` on the launcher (measured 60/60).
- D-268 follow-up: pin as one SVG teardrop (`PIN_PATH`), no white ring, drop shadow; Google marker uses the same path. Checked: typecheck, Storybook build, a 3x screenshot of a pin.
- D-269: transitions. `ClientNav` routes same-site link taps, `navigate()` and `goBack()` through Next's router without a reload. It does not prefetch, and the same path with a new query still loads in full. `@pam/ui/navTransition` gives forward, back, tab and morph moves through View Transitions, with CSS in `globals.css`. The tab bar stays still (`data-pam-tabbar`). `PageEnter` lost its whole-page fade; page sections now rise in a 30ms stagger. Dialogs use a settle curve. The prototype's `go` runs through the same helper. Found and fixed: the next-trip card opens a tab, so it cross-faded instead of growing, and a card tap is now always forward. Trips has no `Page`, so it carries `data-pam-morph-target`. Checked: typecheck, web build plus the bundle budget (79 kB spare), e2e motion (new no-reload test), the full e2e suite 534/534, Storybook build, and prototype screenshots mid-transition (card to Trips, trip card to place, back, tab). Map: no screens added or rewired, so no map change.
- D-270: round buttons spread when there are 3 or more (`PlaceDetail`). Member policies: a "Policies to sign" row on the place page, `/place/policies/` (list, Start/Keep signing) and `/place/policies/view/` (read, then Sign). The first Sign opens a hug-height `BottomSheet` (`purpose="form"`) with the new `@pam/ui/SignaturePad`, which can also take a typed name. After that, one tap with the saved signature shown, then "Next: …". `useMySignatures` keeps signatures in session storage. `placeAsksForPolicies` in config. `TripCard` gets a `policies` token; Trips gets a "One more thing before you go" card after booking. `SignIcon`/`SignedIcon`, en/es keys, a SignaturePad story, two member role stories, prototype routes. Found and fixed: the sheet title sat under the grab handle (now padded like the New message sheet, with a shorter "Your signature" title); the signed state's picture floated loose (now framed). Checked: typecheck, config tests 236/236, web build plus budget (78 kB spare), the full e2e suite 534/534 plus the new `policies.spec` 9/9, and Storybook screenshots (place, list, policy, sheet drawn and typed, signed, one tap, Trips tokens, booked to Sign policies). Map: Member page redrawn in Figma (A place, Trips, new Policies to sign and A policy). The generator gained `{ over: true }` so a forward arrow can go over a row of cards instead of through them.
- PR #23 merged to main at Will's word (merge commit 637d591); `claude/pam-storybook` restarted from main for follow-up work.
- D-271: `PolicyStatusCard` (orange or green) under a place's name when a visit is booked there (`PlaceDetail` `notice`). The signature box has even 16px padding and a corner × (a 28px circle inside the 48px tap floor) that clears and re-signs. Sign sits right under "Your signature:"; "Sign a new way" is gone. `useMySignatures` keeps each policy's own picture and gains `unsign`. `TextLink` is a plain link with an underline on hover, app-wide. Found and fixed: the × came out as a 28×48 oval, because a global `button { min-height }` rule beats layered StyleX, so the circle is now drawn inside a 48px square; a 24px corner offset pushed the tap square 7px off screen. Checked: typecheck, Storybook screenshots (place from a trip, signed with ×, "Your signature:", × to sheet, link hover, green card), web build plus budget, e2e 546/546. Map: Member "A place" note.
- D-272: `ConnectionCard` is a plain `Card` with a round message button top right, the program as a one-line link with a chevron (`/place/?…&from=connections`), and "Connected by Teresa" (`Token` with her avatar) for program people. `/connections/person/` and `ConnectionProfileView` removed; thread options open the program's place (`from=messages`). The place page gained `connections` and `messages` back targets. Found and fixed: the message icon was drawn tiny (an unwrapped SVG is sized down by Astryx, so it is now wrapped in an `HStack` like the place page's icons); the token was 12px text, now 15px. Checked: typecheck, config 236/236, ui 66/66, web build plus budget, e2e 546/546, Storybook screenshots. Map: Member page redrawn ("A connection" removed; Connections → conversation by the round button).
- D-271 addendum: the corner × was off on Will's phone (hanging off the edge, stretched to a pill in Safari). It now sits inside the corner (button at top/right 4px, a 28px circle absolutely centred in it), measured at 14px from the top and right and level with the Signed row; the prefilled box reserves 56px on the right. No WebKit in this sandbox, so the fix removes the flex dependency rather than being checked in Safari. Checked: Chromium screenshots at 2x, e2e policies and a11y.
- D-273: `StatusCard` (generalised from `PolicyStatusCard`, optional href, chevron only with one). A place opened from a trip (`&trip=` now on trip-card links) shows a green calendar card (day / time · Visit booked), no Plan a trip, address before About (`PlaceDetail addressFirst`). Found and fixed: day and time on one title wrapped "AM" alone; split into two lines.
- D-274: Connections message button gets the layered shadow; Profile member tile = award level (`AwardIcon`, `levelForPoints`, to /points/); reminders/alerts card uses `BellIcon`; `MenuList` selected row bold + accent with `CheckIcon` (stroke 3); `AreaChip` is a link (no pill, underline on hover) and Explore's heading is one line with an ellipsis. Checked: typecheck, config 236/236, ui 66/66, web build + budget, e2e 546/546, Storybook screenshots. Map: Member "A place" and "Profile" notes.
- D-275: `AreaSearch` is a tall `BottomSheet` (title, Done, `SearchField` focused on open, "Use my current location" via `navigator.geolocation`, results as `MenuList` rows with kind and the chosen one ticked; choice held until Done). Explore and /places/ both use it; Explore's hide-on-scroll no longer waits on the panel. `search_areas` fixture in `mockSupabase`. Spanish privacy and no-results strings fixed. Found and fixed: the sheet focused Done, so typing went nowhere; the input is focused on open. Checked: typecheck, config 236/236, web build plus budget, e2e 549/549 (area-picker updated plus one new), Storybook screenshots en/es, empty and typed. Map: Member Explore note.
- D-276: `ThreadVisit` under a member↔program conversation header (DemoThread and the real thread page); the place takes `from=thread&thread=<id>` for "Back to the conversation". Storybook member Messages falls to the example set (Teresa and Sandra). Checked: prototype loop list → Sandra → visit card → place ("Back to the conversation") → back.
- D-277: `data-pam-back` on `BackButton` and `PageTitle`'s back; `ClientNav` keeps a session-storage depth (+1 per push, −1 on popstate) and sends a marked back button through `history.back()` while depth > 0; the prototype pops its stack. New `e2e/back.spec.ts`. Checked: typecheck, full e2e suite, prototype Profile → Text reminders → Back.

- D-279: the policy screen's sign area is a fixed bottom dock (outside `SubPage`, with a spacer); Done replaces Help on the list and policy screens and on the last policy (`leaveFlow(steps, fallback)`, `via=list` on list links; ClientNav goes back only within its own depth; the prototype pops n). Found and fixed: a cold list's Done went to about:blank (a one-step leave used plain history.back); now depth-checked. Checked: e2e policies + back 24/24, the full suite, prototype loop to the green card.
- D-278: Points rebuilt: hero card (AwardIcon medal, level, points, ProgressBar to next), Ways to earn from POINTS_RULES, compact ladder (44px rows, breathing ring on the current rung, meaning only on the next), badges as a 4-across medal grid, confetti once per new level (localStorage). Profile's award tile switched from LEVELS to badgeForPoints so both say "Rooted". Checked: typecheck, config 236/236, web build + budget, e2e 561/561, Storybook en/es. Map: Member Points note.
- D-278 addendum: Ways to earn says "Plan a trip to a program" (+25) and "Go back to a program again" (+50, no weekly framing); strings `points.way.plan` / `points.way.return` replace signup/streak/weekly. Checked: typecheck, config tests, Storybook screenshot.
- docs/points-awarding.md: the awarding spec Will asked for. It covers the principles (database-only, append-only, members only, idempotent, honest proof, no comparison); each rule with points, trigger, proof, once-per and status (live: save, finish setup); plan-a-trip once per program; attendance 100/60 with no double pay; the return bonus at most once per program per week; the ladder trigger and the badge evaluation; anti-gaming; prerequisites; build order; and open questions. Found while writing it: the database `badges` table is seeded with an older badge set than config's `BADGES`, and `LEVELS` duplicates the ladder; both are noted for the build.
- Points spec: the open questions and the two found problems moved to a "Decide before building" checklist at the top of docs/points-awarding.md (Will: "include those questions for us to work through later when building"), and STATUS "What needs a human" row 15 points to it.
- D-280: `textLinkLook` exported from TextLink; applied to Check hours on Google and the four search Cancels. Checked: typecheck, Storybook hover computed style.
- D-281: the trip view of a place.
  - `VisitCard` hero: "Your next visit", the day, the time, and a "Change appointment" link.
  - Order: address, hours, then About.
  - Change appointment uses Plan a visit with `change=<id>`. Saving records the new time in `pam.trips.moved` and returns with `leaveFlow(2)`. The place, Trips, ThreadVisit and Explore read moves through `withMoves`/`readMoves`.
  - Saved bug: Storybook fixture ids `s1`–`s3` didn't match the example set's `dummy-place-*` ids used by trips. Renamed the fixtures and the stories that used `s1`.
  - Checked: typecheck, web build, Storybook screenshots, `e2e/visit-change.spec.ts` (with axe), full e2e.
- D-282: saving a changed visit now shows `SuccessScreen`: "Your visit is moved!", the new day and time, Go home, and an automatic redirect to `/` after 5s. This replaces D-281's `leaveFlow(2)` back to the place. Checked: typecheck, web build, `visit-change.spec.ts` (6/6), and the Storybook prototype (celebration, then Explore).
- D-283: TabBar gets a 40px fade above it (transparent to the page colour; aria-hidden; pointer-events none), for every role. Checked: typecheck, Storybook build, a screenshot of Explore scrolled under the bar.
- D-284: the TabBar fade is 96px with eased colour-mix stops, and the spacer gets +56px so the end of a list clears the fade. Checked: typecheck, Storybook build, screenshots at the top and end of Explore. Place-card redesign options (Today / A tidy / B tidy + category tile) mocked in a screenshot for Will to choose; nothing built yet.
- D-285: fade audit. FloatingAction moved to z-index 11 and draws `edgeFade` above itself; `TabBar` has `hasFade`, off on Trips (the prototype's LocalTabBar). The fade style moved to `edgeFade.ts`. Found: TabBar renders only in Storybook; the live app has no bottom bar yet.
- D-286: `FeatureTile` `hint` adds a "Your badge" pill over the art on the award tile; the accessible name is "Your badge: Rooted".
- D-287: `CategoryArt` (3 flat, faceted SVGs in data tokens) and PlaceCard layout B. Mistake: the first `CategoryArt` used a helper function inside `stylex.create`. Storybook's compiler accepted it but Next's StyleX babel plugin failed the web build ("Unsupported expression"); the colours are now literal strings. Lesson: run `pnpm --filter @pam/web build` before trusting a Storybook build. Checked: typecheck, web build, bundle budget, screenshots, full e2e (re-run on the fixed build).
- D-288: CategoryChips draws a blurred tone-coloured circle behind each icon (24px, blur 5px, 60%; data shade 3; isolation on the wrapper). Checked: web build, Storybook screenshot. Note: a rebuild during the previous e2e run invalidated that run; the full suite was re-run after this commit.
- D-289: MapDrawer DOCK 112→100 and `bodyDocked` hides the list when docked; `pam.brandPink` token used by TabBar (tabOn, avatar ring, the StatusDot override) and NotificationBell's dot. Checked: typecheck, Storybook screenshots (docked drawer at 390 and 320, case manager bell).
- D-290: MapDrawer half = round(available × 0.5) + 48, capped at full. Checked: typecheck, Storybook screenshot.
- D-291: PlaceDetail quick actions became a MenuList in a Card (with descriptions; external rows open in a new tab); order is directions, message, call, website; `directionsHref(..., placeId)` adds `destination_place_id`; MenuList drops the last row's divider (an Astryx :last-child shorthand bug). place.spec updated plus one new test. Checked: typecheck, web build, Storybook screenshots, full e2e 570/570.
- D-292: Saved visit tags (`useNextVisits`, two-line green tag, `trip` in the link means the visit view on the place, Back still to Saved), white tiles with `GlowIcon` lg in the category tone; `GlowIcon` shared with CategoryChips; a SavedGrid story. Mistake: positioning the picture covered the card's link; fixed with pointer-events none. Checked: typecheck, web build, Storybook screenshots at 390 and 320, a click-through (open, back, change time, tag updates), full e2e 570/570.
- D-293: softer GlowIcon (sm/md/lg in the same proportions); `CategoryGlow` helper used by Saved, TripsView, ExploreScreen's next trip, PastTripsView, person page; TripCard art white with a hairline; NextTripCard front tile white. Checked: typecheck, web build, Storybook screenshots, full e2e 570/570.
- D-294: no `travelmode` in directionsHref (SOP A17); "Open in Google Maps"; MenuList description 14px.
- D-295: art kit (`art/kit.tsx`), CategoryArt rebuilt on it, BadgeArt (20 badges, round or square, locked in grey), ConnectionsArt; Profile tiles; Points hero, ladder and badge grid; `badge-art.test.tsx`; a BadgeArt story with everything.
- Mistake found: CI's "Types, unit tests, build" job was red from 79263b5 to 673cf9e, because the D-287 PlaceCard put "· " in the distance text and broke a UI unit test. I hadn't run `pnpm --filter @pam/ui test` locally. Fixed by making the dot a separate aria-hidden mark. From now on the UI and config unit tests are part of every local check. Checked: config 236, ui 67, `pnpm -r typecheck`, web build, budget, full e2e 570/570.
- D-296: Saved visit tag is a white one-line chip at the top left (12px, shadow); `GlowIcon` `hasGlow`, off on Saved. Checked: screenshots at 390 and 320, ui 67, config 236, typecheck, web build, e2e 570/570.
- D-297: GlowIcon deleted. `Tone.tsx` provides ToneDot (half circles), ToneGround (pale fill and shards, the facet a color-mix of shades 1 and 2) and ToneIcon. Used in CategoryChips, SavedGrid (`tone`), TripCard (`tone`), NextTripCard (`tone`); `CategoryIcon` and `categoryTone` are exported from SavedView. Shade 2 was tried first and was too strong. Checked: screenshots, ui 67, config 236, typecheck, web build, e2e 569/570. The one failure was saved.spec "saving writes it down…" on iphone-se, which then passed 72/72 over 3 repeats: a timing flake, noted rather than retried away.
- D-298: `Grain` (feTurbulence, grey, multiply 16%) in art/kit, drawn by ArtFrame and ToneGround; ToneDot halves swapped so the dark half is on the left; Tone.tsx is now 'use client' (useId). Checked: 3× screenshots, ui 67, config 236, typecheck, web build and budget, e2e 570/570.
- D-299: Grain raised to 30%. saved.spec flake (a tap before hydration was lost) fixed with settled() before the two taps; 120/120 over 5 repeats at 4 workers, full e2e 570/570. Also ui 67, config 236, typecheck, web build.
- D-300: CategoryChips `chipWithDot` paddingInlineStart 15px. Measured: the circle is 11px from the top, bottom and left (Astryx pulls the icon in by 4px). Checked: ui 67, config 236, typecheck, web build, e2e 570/570.
- D-301: CategoryArt per-category picture lists, with `seed` hash and `variant`; FamilyHome and FamilyPeople replace the grocery bag; PlaceCard `artSeed` passed by every list. Blend-mode mock (normal, overlay, multiply, ink) shown, not built. Checked: screenshots, ui 67, config 236, typecheck, web build, e2e 570/570.
- D-302: `ToneBakedIcon` (the icon twice, overlay, one grid cell); `CategoryIcon isBaked` on Trips, next visit, past trips and person page; FamilyPeople removed, FamilyHome is the only family picture. Checked: 3× screenshots, ui 67, config 236, typecheck, web build, e2e 570/570.
- D-303: SavedGrid tag top/left 12px (the tile radius is 24px, measured); pantry trip moved out of DUMMY_TRIPS into dummyTripsFor's pool; TripsMap pins placed in pixels from the viewport (between the note and the half drawer), left 44–80%. A first percentage fix failed at 390 and 320×640 and was replaced. Checked: screenshots at 390×844, 320×640 and 430×932, ui 67, config 236, typecheck, web build, e2e 570/570.
- D-304: six example places added (config dummy-places and the Storybook PLACES); saved_places_mine returns the first three; the service_detail mock finds by p_id; meters spaced 450. Checked: Explore 9 cards / 3 saved, the family filter shows 3, a new place opens to its own page; ui 67, config 236, typecheck, web build, e2e 570/570.
- D-305: `VisitTag` shared by SavedGrid and PlaceCard; Explore cards get the tag and a trip link via useNextVisits; `visitTagLabel` shared. Place profile story with controls (`screenWithControls`) replaces the Place and PlaceFromTrip stories; the flow map story id is updated. 'New message' row (`MenuItem.hasDot`, `newMessageFrom` in src/lib/placeMessages.ts); a Jordan↔Renee pantry conversation added. Checked: all four story combinations, ui 67, config 236, web vitest 11, typecheck, web build, e2e 570/570 plus 117/117 after the refactor. Found: apps/web vitest is not in CI.
- D-306: `MenuItem.isDescriptionOneLine` (the New message preview is one line with "…"); Call's subtitle is the number, via `displayPhone()` in @pam/config (place page and ProgramView); `place.quick.call.body` removed from en/es. Checked: story screenshots, phone.test, ui 67, config 238, web 11, typecheck, web build, Storybook build, e2e 570/570.
- D-307: Points badges in a `Card` (16px lower, centred title, padding 3 and no column gap so names still fit at 390px); `DUMMY_EARNED_BADGES` = Scholar in new `@pam/config/dummy-badges`, gated on USE_DUMMY_PEOPLE and member; the hero card shows the newest badge under a divider (`points.hero.newest`). A first pass at the edit sliced the file at the signed-out `</Page>` and blew it up; restored and redone with `rindex`. Checked: screenshots at 390 and 320, ui 67, config 238, web 11, typecheck, web build, Storybook build, e2e 570/570.
- D-308: Steward badge removed (points.ts, BadgeArt, en/es keys; points.spec checks Anchor instead). Badges are config-only, so no migration. Checked: Points screenshot ("1 of 12"), ui 67, config 238, web 11, typecheck, web build, Storybook build, e2e 570/570.
- D-309: hours row in PlaceDetail's quick actions (ClockIcon, today from `PlaceStatus.today`), week in a BottomSheet (hug) with today marked; primary action in a fixed footer with edgeFade; place.about → "About program". A first pass added its own Close button and tripped strict mode (the sheet has one); removed, test presses Escape. Checked: screenshots, ui 67, config 238, typecheck, web build, Storybook build, e2e 570/570 then 33/33 for place + visit-change after the fix.
- D-310–D-312, D-314: PhoneSignInCard gaps 3→5 and 4→6; LanguageSwitcher trigger `size: 'sm'` (dial) with option xstyle (48px floor, 17px, 24px end padding); ProgramView's policies row moved into quickActions; `program.quick.phone` = "Contact phone number". Hours sheet gets 20px above its title. Phone/website fields already existed in Edit and in join's ProgramDetailsStep. Checked: screenshots, ui 67, config 238, typecheck, web build, Storybook build, e2e 570/570.
- D-309/D-310 second pass: hours row is "Hours: {day}" (`place.hours.row`, `hoursRowLabel` prop) with the times as its description, no open line; PhoneSignInCard gaps reverted, LegalFooter gap 2→6. e2e regexes now `/^Hours: /`. Checked: screenshots, typecheck, web + Storybook builds, e2e 570/570.
- D-319: `JoinPreview.startAt`, `PrototypeJoin` reads `?step=`; `SignUp` story with a `step` control in Member, CaseManager and ProgramLead stories (member's old whole-flow SignUp replaced). Checked: 19 step screenshots, typecheck, web + Storybook builds, e2e 570/570.
- D-315: migration 0073 (create_invite: a case manager may invite 'admin'; non-member invites carry no caseload) + 04_rpc_test flipped; InviteView third row (admin, super_admin), ProfileView invite row for super_admin, InvitesLogScreen "+ New invite" pill in place of Help, SuperAdmin Invite story, flows.mjs. 0073 NOT deployed — list_migrations is denied here. A write-before-read truncated InvitesLogScreen once; restored from git. Checked: db tests, screenshots, config 238, ui 67, typecheck, builds, e2e 570/570. Flow map: pages "3 · Case manager" and "5 · Super admin" redrawn (Invite someone note and arrow label; super admin Invite someone node with edges from Profile and from Invited people). Screenshots still not uploaded (mcp.figma.com blocked).
- D-320: ScheduleView's SegmentedControl replaced by a DropdownMenu radio in `titleAccessory` with new `LargeTitleHeader.isAccessoryInline`; keys `schedule.range.*` added, `schedule.view.day/week/month` removed. Underline is a background-image line just under the words (a border sat at the foot of the 48px target; Astryx button resets text-decoration). Checked: screenshots, config 238, ui 67, typecheck, builds, e2e 570/570.
- D-316: `checkIns.ts` store; ScheduleView `canCheckIn` with CheckInButton (Tooltip, AlertDialog, squash + fly keyframes, data hues orange/shamrock/purple/blue/yellow/red), name carries the link, SignIcon badge on success tokens; BookForMemberView + `/program/book/` route and story; NewTripView `forMember`; AddedTrip `forMemberId/forName`; ProgramHome merges booked trips; AddMenu uses navigate(). Astryx has `--color-accent`/`--color-on-accent` (no `background-accent`); data hues are orange, shamrock, purple, pink, yellow, teal, red, blue, gray. Checked: walk-through screenshots, config 238, ui 67, typecheck, builds, e2e 570/570.
- D-321: `\bPAM\b` → `Pam` across locales, apps/web/src, packages/ui, stories, e2e, tests and flows.mjs (157 files); SMS templates, the SMS rule and their tests kept on "PAM:" (carrier samples) — ask Will. Flow map page "4 · Program lead" redrawn for D-316/D-320. Checked: config 238, ui 67, web 11, typecheck, builds, e2e 570/570.
- D-322/D-323 + SMS "Pam:": BookForMemberView rebuilt on List/ListItem (next visit here from DUMMY_APPOINTMENTS + booked trips, `whenHappened`, one-line snippet); AddPersonView + `/program/book/new/`; `Invite.trip` through `inviteLink`/`readInvite`/`recallInvite`, PrototypeSignIn/PrototypeJoin carry `trip`; JoinScreen done-step "Your visit is booked" variant; NewTripView `forMember.phone` ending with the text shown; Onboarding › MemberBooked story. ScheduleView: ghost nav arrows, no total, search only on week/month. SMS: templates, render.ts rule, templates.json, tests and campaign samples → "Pam:". Checked: walk-through screenshots, config 238, ui 67, typecheck, builds, e2e 570/570.
- D-324: `SignedMark` exported from VerifiedBadge.tsx and used by ScheduleView; PersonPoliciesView + `/person/policies/` (Astryx Banner warning when unsigned remain; `Notice` only takes NOTICES keys); row on person/page.tsx (program view); ProgramLead › MemberPolicies story; keys person.policies.*, nav.back.person. A cwd flip mid-command created a stray apps/web/apps/ once — removed. Checked: screenshots, config 238, ui 67, typecheck, builds, e2e 570/570.
- D-325: Member.stories title 'Member/Created' (+ SignUpWalk from Onboarding), new MemberInvitedByProgram and MemberInvitedByCaseManager stories, States under Member/Created, Prototype 'Member/Prototype'; flows.mjs ids member-app-screens→member-created. The D-321 sweep had turned invite codes into "Pam-…" — the expired-link story stopped navigating and user-flows.mjs hung on 'Your email'; codes restored to "PAM-". Worker was OOM-killed once mid-run. Checked: stories render, Storybook build, map regenerated, e2e.
- D-326: `Page.footer` (sticky bottom, full-bleed, 56px gradient from transparent to the page colour, safe-area padding, `pointer-events` only on the inner column), passed through `SubPage`; PlaceDetail's fixed footer and `primaryAction` removed, the place page passes "Plan a trip" as the footer and hides the directions BigButton then; the policies MenuList at the foot became the last quick-action row. Why: a fixed strip paints mid-page in a full-page capture (Chromatic) with a hard white edge. The place a11y test now reads the page at its end (axe saw the last row half under the sticky footer on a 320 phone). Checked: screenshots (top, mid, end, full-page), config 238, ui 67, typecheck, web + Storybook builds, e2e 570/570.
- Flow map after D-325: Will hit "Couldn't find story matching 'member-app-screens--explore'" from the Figma map — pages "2 · Member" and "1 · Sign in & joining" still linked the old ids. flows.mjs memberJoin → `member-created--sign-up-walk` (Onboarding lost its Member story); both pages redrawn via use_figma (roots 31:2 and 31:297); every link checked: 0 old ids.
- D-313: `dummy-services.ts` (DummyService, servicesFor, policiesForService, servicesForPolicy), `useServices` session overlay, `siteName` shared; ServiceView + `/place/service/`, place page `extra` slot (PlaceDetail) with a Services card; MemberPoliciesView `serviceId` on both screens (`?service=`); NewTripView `what` step (`initialService`, totals 3/4), AddedTrip `serviceId/serviceName`; ServiceEditView + `/program/service/`, ProgramView services card (read + edit), PoliciesView rows say which services; ProgramDetails `services` names at sign-up; routes, Member › PlaceService, ProgramLead › EditService/NewService; flows.mjs. TextLink has no xstyle. Checked: see DECISIONS.
- D-326 extended: `footer` on NewTripView (When's Next, Check's Add/Book), MemberPoliciesScreen (Start/Continue/Done) and MemberPolicyScreen (the D-279 dock + spacers removed), ServiceView. Checked: screenshots, typecheck, web build, e2e.
- D-313 second pass: `ServiceCards` (Astryx SelectableCard rail, scroll-snap, full-bleed) replaces the services MenuList on the place page; `pickedService` state, `visit.serviceId`, rows + PlaceDetail address/phone/website + directions + Plan a trip href follow the active service; `DummyService.address` (+ editor field, ServiceView address/directions row), `DummyTrip.serviceId` on both example trips. Checked: screenshots, config, ui, typecheck, builds, e2e.
- D-313 third pass: `dummy-booking.ts` (appointment | dropin with cadence/weekday/time, `nextDropIn`); `PlaceDetail.layout='chooseFirst'` (extra, About, rows); ServiceCards stacked `variant="muted"`, locked mode shows the booked one; `DropInCard`; place page footer: Get directions for drop-in, Plan a trip disabled until a service is picked, policies row hidden pre-booking when services exist, progress counted per service; ServiceView + `/place/service/` removed (routes, story, flows); Place profile story options Place profile / No services / Drop-in / Visit profile; ClockIcon exported from @pam/ui. Stale `.next/types` for the removed route broke typecheck once — `rm -rf apps/web/.next/types`. Checked: screenshots, config, ui, typecheck, builds, e2e.
