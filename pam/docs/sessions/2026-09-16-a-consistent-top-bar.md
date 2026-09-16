# 2026-09-16 — A consistent top bar, everywhere

**Phase:** 1 (UI/product polish on Foundation) · **Sessions so far:** 20

## What changed

A large, multi-part header/UI request from Will, worked in this order:

- **Places category chips** now match Saved's chip height. Traced to Astryx's
  `Button` enforcing a 48px `min-height` on `<button>`-tag rendering only, not
  on `<a>` (see D-131). Every chip now carries a real `href` +
  `preventDefault()` onClick, with `role="button"` + `aria-pressed` kept for
  correct semantics.
- **`AreaChip`** (the header's location control) merged from two adjacent
  buttons — an area-name button and a separate pencil `IconButton` — into one
  `Button` with the pencil as `endContent`, trailing rather than leading the
  label, per Will's "the edit button and location button should be one, not
  two separate buttons."
- **The family-services example place** saved on a member's profile no longer
  throws when opened. `/place/?id=…` now checks a dummy-place id against
  `DUMMY_PLACES_BY_ID` before hitting the network, the same "real data wins
  silently" shape dummy people and dummy notifications already use (D-133).
- **`RoleSwitch`** (the super admin's role preview) is now an icon-only
  trigger, matching the sign-in locale switcher, and is wired into every
  signed-in screen's header rather than only some of them — `place/page.tsx`'s
  three separate header renders (loading, missing/error, ready) were
  consolidated into one shared JSX value in the same pass, which was also
  part of what made that screen's header inconsistent before. A new
  `useRoleView` hook (`lib/useViewedRole.ts`) gives a page a single shared
  `useViewAs` instance when it both reads the viewed role *and* renders the
  switcher that sets it, replacing the old pattern of instantiating two
  separate, independently-stateful hook calls that could desync.
- **Settings (`/account/`)** rows now share one font size, a leading icon, and
  left alignment; the language row gained a `GlobeIcon`, more space before its
  chip, and a white chip instead of the default grey `Badge`.
- **Case manager / Program lead people lists** ("Your people") no longer show
  a location line under each name.
- **A person's profile screen** no longer repeats the person's name under the
  page title (which already is their name); shows location and preferred
  language instead. `DummyPerson` gained a `language: Locale` field, populated
  for all twelve example people.
- **New: `PeopleStrip`** (`packages/ui/src/PeopleStrip.tsx`, subpath export) —
  an Instagram-stories-style horizontal strip of circular avatars with a
  truncated name below, masked edges, and a mocked activity-highlight ring.
  Replaces `HomePeoplePreview`'s vertical person-row list on Home while a
  super admin previews Case manager, Program, or Super admin. The ring is
  explicitly not wired to anything real yet — see the file's own comment.

## What was wrong, and what missed it

- **`aria-pressed="false"` on a bare `<a>` is a critical axe violation**
  (`aria-allowed-attr`). Caught only by the full Playwright suite, not by
  local manual checking — the chip *looked* right and worked with a mouse.
  Fixed by adding `role="button"` alongside `aria-pressed`; an earlier attempt
  using `aria-current` instead avoided the axe violation but silently broke
  `getByRole('button', ...)` lookups, since the element's actual role stayed
  `link`.
- **`AreaChip`'s merged accessible name didn't match its visible text.**
  `changeLabel` interpolated the raw, unformatted `area.label` ("City Hall")
  while the visible chip showed the formatted "Near City Hall" — so
  `area-picker.spec.ts`'s `getByRole('button', {name: 'Near City Hall'})`
  timed out. The two strings were built from the same source data in two
  different places; fixed by formatting once and reusing it for both.
- **`RoleSwitch`'s own-role accessible name silently dropped the role name.**
  The formula only added the role name when *not* viewing your own role,
  so a super admin looking at their own screen got a trigger whose accessible
  name was just "Switch the view" — no role at all. Broke
  `directory.spec.ts`'s initial-state assertions. Fixed by always appending
  the current role/viewing-label regardless of `isOwn`.
- **A shared dynamic-import component can leak a new dependency into the
  budgeted bundle just from being imported in more places.** See D-132.
  Neither typecheck, build, nor the unit suites would have caught a 3.2 kB
  Home-budget regression; only `check-bundle-budget.mjs`, run deliberately
  after the `RoleSwitch` change, did. The fix (plain `items` array instead of
  `DropdownMenuRadioGroup`) still leaves the budget 1.1 kB over — pre-existing
  and disclosed in `STATUS.md`, not solved here.
- **The e2e suite failed wholesale (423/426) on the first run in this
  session** — not a regression, but the environment's pinned Playwright
  Chromium build (`chromium_headless_shell-1243`) wasn't the one actually
  installed (`chromium_headless_shell-1194` under `/opt/pw-browsers`).
  `playwright.config.ts` already has an escape hatch for exactly this
  (`PLAYWRIGHT_CHROMIUM_PATH`, added in an earlier session) — pointing it at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` fixed the whole run
  without installing anything new.

## Decisions

- D-131 — the `Button` component's 48px floor applies to `<button>`-tag
  rendering only, not `<a>`; use `href` + `preventDefault()` to get an
  anchor-rendered, unfloored control when one is needed.
- D-132 — a component dynamically imported from many pages can have a newly
  added dependency promoted into the shared "every route" bundle by webpack;
  avoid introducing dependency surface unused elsewhere into a widely
  fanned-out lazy component.
- D-133 — dummy places now resolve locally by id before any network call,
  the same "real data wins silently, dummy data only fills a genuine gap"
  rule already applied to dummy people and notifications.
- D-134 — two larger pieces of the 16 September request (client-side routing
  everywhere; a fully persisted share-places-with-people feature) were
  explicitly chosen by Will over lighter alternatives, and are **not**
  started. Recorded so the gap is visible rather than implied done.

A follow-up request arrived mid-session (the `PeopleStrip` redesign) and was
folded into the same pass; it is not a separate decision, since Will asked
for it directly rather than choosing between options.

## Verified

| Check | Result |
|---|---|
| `pnpm --filter @pam/ui typecheck` | clean |
| `pnpm --filter web typecheck` | clean |
| `pnpm --filter web build` | succeeds, static export |
| `node scripts/check-bundle-budget.mjs` | 501.1 kB gz — 1.1 kB over the 500 kB §12 budget (pre-existing, disclosed, not solved this session) |
| `pnpm --filter @pam/ui test` | 65 passed |
| `pnpm --filter @pam/config test` | 211 passed |
| Playwright e2e (`test:a11y`, full suite, 3 viewport/theme projects) | 426 passed, 0 failed |

## Left undone

- **Client-side routing everywhere**, chosen by Will over a header-content-only
  fix, so the persistent top bar is genuinely non-reloading rather than
  header-content-consistent-but-still-a-full-page-navigation. Not started —
  see D-134.
- **The full share-places-with-people feature** — share icon, dropdown,
  autocomplete search over a case manager's people list, backed by a real
  table + RLS + a notification to the recipient. Not started at all: no
  migration, no UI. Chosen by Will over a UI-only/dummy-data version — see
  D-134.
- The §12 budget is still 1.1 kB over. Unrelated to this session's changes
  (the `RoleSwitch` fix reduced a self-inflicted regression from 3.2 kB back
  down to the pre-existing 1.1 kB, not below it).

## Needs a human

- Sign-off on whether client-side routing (a real architectural change,
  touching every page's navigation) should happen as its own dedicated pass,
  given its size relative to everything else in this session.
- Confirmation of the share-places feature's exact shape (who can see a
  shared place, whether the recipient gets an SMS or only an in-app
  notification, whether a share can be revoked) before a migration is
  written — nothing here should be guessed given §4's access-control history.
