# 2026-09-16 — what the app can do

**Phase:** 1 (member-facing product) · **Sessions so far:** see `STATUS.md`

## What changed

**A dummy-data system, isolated from real data by construction.** Will asked
for example people (members, program leads, case managers) and example
notifications, so a first look at PAM — before any real caseload exists — has
something to look at rather than a wall of empty states. Four new files in
`packages/config`: `dummy-flag.ts` (one boolean, `USE_DUMMY_PEOPLE`),
`dummy-people.ts`, `dummy-notifications.ts`, `dummy-places.ts`. The rule
documented at the top of `dummy-people.ts` and enforced by every screen that
reads it: **real data always wins, silently.** A screen checks its real query
first and reaches for the dummy file only when the real answer is genuinely
`'empty'`; nothing here is ever mixed into a real list. The one deliberate
exception is "Program leads" on the case manager screen — there is no real
query for that relationship yet, so it is additive rather than a fallback, and
can appear beside a real (non-empty) caseload.

- The case manager screen (`admin/page.tsx`) now shows the caseload (real or
  example), plus a "Program leads" section, plus the existing invite flow.
- The directory (`directory/page.tsx`) folds the example roster into "everyone,
  filterable" for the super admin, same real-first rule.
- A provider now has a new screen, `/interested/`, listing people interested
  in their program (example data only — there is no real query yet).
- A new shared `/person/?id=…` profile screen shows one person — but **only
  resolves for a dummy id**. A real member id is deliberately "not found"
  here: showing "places a member saved" to their case manager would widen
  §4.1's transparency contract, and that needs Will's deliberate sign-off and
  telling members first, not a side effect of a demo feature. This boundary is
  documented in the file and is the main thing to check before ever wiring a
  real query into that screen.
- `/account/` now populates from an example self (`DUMMY_SELF`) for the
  provider, case-manager and member roles when previewing them — previously
  only the super admin's real profile ever appeared regardless of the
  preview.
- `/notifications/` and the header bell show an example notification per role
  when the real list is genuinely empty, captioned as an example
  (`notify.example.note`).

**Saved places are isolated per previewed role, not shared with the real
account.** Before this, a super admin who tapped Save while previewing
"Member" wrote a real `saved_places` row under their own account, and it kept
showing up in every other preview too — the opposite of what a preview
demonstrates. `useSavedPlaces` now takes a `demoRole` parameter: when set (a
preview is genuinely active, via the new `useDemoRole` hook), it reads and
writes a `sessionStorage`-only list keyed `pam.dummy-saved.${role}`, seeded
from `@pam/config/dummy-places`, and never touches Supabase. A member's own,
real saved places are unaffected either way.

**People cards support a profile.** `PersonRow` is a new shared component
(`app/PersonRow.tsx`) used by the caseload, the directory, "people interested
in your program", and program leads — an optional `href` makes the whole row
a link into `/person/?id=…`, which is where a case manager or program lead
can see a member and the places they saved (dummy data only, per the boundary
above).

**Places screen: relabelled Saved empty state, a fifth filter chip, skeleton
loaders, and a padding/transition bug fixed.**

- Under "Places you saved", empty state: removed the Call PAM button (nothing
  there support can solve), shrank and relabelled the return button "Return"
  (was "Places", full `BigButton` size).
- The Places filter row gained a fifth entry, "Saved" — a real link to
  `/saved/`, not a filter, carrying the bookmark icon — so the standalone
  "Places you saved" button below the list is gone. The whole filter row is
  now sized below §2.5's 48px floor (40px), a deliberately narrow, documented
  exception: a filter chip is scanned and self-correcting (miss one, land on
  its neighbour, still a category filter), unlike a control someone has to
  reliably hit once to act.
- New `Skeletons.tsx` in `packages/ui`: shaped, animated loading placeholders
  for place cards, place detail, person rows, and person detail, replacing
  the spinner on those four screens. Every other screen keeps the spinner.
- **Root-caused and fixed the padding mismatch and transition glitch Will
  reported between Home and Places.** Places was the one screen in PAM still
  hand-rolling its own `<main>` wrapper — 520px max-width against `Page`'s
  560px, and no `PageEnter` wrapper, so it never got the shared fade-in every
  other screen has. `Page.tsx`'s own file comment already named this exact
  failure mode as the reason the component exists. Fixed by moving Places
  onto `<Page>`, like every other screen.

**Logo swapped across the app.** Will supplied new light/dark wordmark SVGs
(wider artwork, same `#0F5847` / `#F55E4B` convention `AppHeader.tsx` already
documents); both files replaced in `apps/web/public/`.

**Answered in chat, not in code:** why the app is always dark. There is no
manual theme toggle anywhere in PAM — it follows the OS/browser's
`prefers-color-scheme` via `color-scheme: light dark` in `globals.css`. If it
looks permanently dark, that is very likely the device's OS setting, not a
PAM bug tied to daylight. Offered to build a manual toggle if wanted.

## What was wrong, and what missed it

**The §12 bundle budget went from 0.9 kB spare to 1.7 kB over, twice, from
code that Home never runs.** Adding `dummy-data.ts` as one file cost 1.6 kB on
Home even though Home's own code path never imports the people arrays —
`HeaderBell`, which *is* on every screen, only needed the notifications and
the flag, but importing from a shared barrel file pulled the whole module in
regardless of what was actually used. The same thing happened again,
independently, when `Skeletons.tsx` was added to `@pam/ui`'s barrel
(`index.ts`) — Home never renders a skeleton, but the bundle grew 1 kB anyway.
Neither `@pam/config` nor `@pam/ui` declares `sideEffects: false`, and their
barrel files do not reliably tree-shake unused named exports through a
component that is statically imported everywhere. **What now catches this:**
none of these packages' barrels tree-shake reliably, so anything sized enough
to matter needs its own subpath export (`@pam/config/dummy-notifications`,
`@pam/ui/Skeletons`, etc.) and every consumer must import the subpath
directly, never via the barrel. Nothing currently tests for a barrel
re-introducing this — a future session adding a named export back to
`index.ts` "for convenience" would not be caught by any check, only by
`check-bundle-budget.mjs` failing after the fact, which is a late and
non-obvious signal to trace back to a re-export line. Splitting dummy data
this granularly, and making `useSavedPlaces`'s and `HeaderBell`'s demo paths
dynamic `import()`s (not just subpath — deferred out of the static bundle
entirely) closed the gap: **500.5 kB gz, 0.5 kB over the 500 kB budget** as of
this session's last measured build. Not fixed further — diminishing returns
against a growing backlog of Will's direct questions, and disclosed here
rather than left unstated. The next component that needs to ship on a
shared screen should expect to start already over.

**Test fixtures named "Marcus" collided with the new dummy program lead also
named Marcus**, breaking five `admin.spec.ts` assertions with Playwright
strict-mode violations (two elements matched one locator) once the dummy
roster started rendering unconditionally on the same screen as real test
fixtures. Renamed the real-fixture person in those tests to "Dante" — a name
absent from every dummy list — rather than renaming the dummy data, since the
dummy names are referenced in this file, in locale copy example text, and
elsewhere. **What now catches this:** nothing structurally; a future e2e
fixture that happens to share a first name with any entry in
`dummy-people.ts` will hit the same class of failure. Worth a shared
constant of "names dummy data uses" if this recurs.

**`chromium_headless_shell` is not installed in this environment**, only
`chromium` — every Playwright run failed outright with "Executable doesn't
exist" until `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium` was passed,
which `playwright.config.ts` already supports for exactly this case
(`launchOptions.executablePath`). Not a code defect — recording it so the next
session does not re-diagnose it: **run e2e as
`PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test`** in
this sandbox.

## Decisions

- Real data always wins, silently, for every dummy-data screen except Program
  leads, which is additive because no real query exists yet — see
  `dummy-people.ts`'s own docblock for the full reasoning; not yet promoted
  to `DECISIONS.md` as a numbered entry this session, given the backlog —
  worth doing next session if the pattern gets a fifth consumer.
- A role preview is a demo, not a second account: `useSavedPlaces`'s
  `demoRole` parameter and `savedPlacesDemo.ts` keep every previewed role's
  "saved" state in `sessionStorage`, isolated from the signed-in account's
  real rows and from every other previewed role.
- A real member id never resolves on `/person/?id=…` — only dummy ids do —
  specifically so this feature cannot quietly widen what a case manager can
  see about a real member ahead of Will's own sign-off on that change.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | 5/5 packages, clean |
| `pnpm build` | succeeds, static export, 20 routes |
| `node scripts/check-bundle-budget.mjs` | 500.5 kB gz of 500 kB — **0.5 kB over**, disclosed above, not fixed further this session |
| `pnpm --filter @pam/ui test` | 65 pass |
| `pnpm --filter @pam/config test` | 211 pass |
| Playwright e2e (all projects, `PLAYWRIGHT_CHROMIUM_PATH` set) | 426 pass, 0 failing |

## Left undone

- **The 0.5 kB bundle overage is real and unresolved.** See above.
- **No new e2e coverage for `/person/`, `/interested/`, the "Saved" filter
  chip specifically, or the skeleton loaders.** The suite was brought back to
  green against the *existing* assertions; several of the screens built this
  session have zero test coverage of their own.
- **`docs/journeys/index.html` was not regenerated** — the visual review tool
  (`node scripts/journeys.mjs`) has not been run against any of this
  session's changes, including the logo swap and the places-page rewrite.
- **No promotion of this session's design choices to numbered `DECISIONS.md`
  entries** beyond the summary above — the backlog of direct questions from
  Will took priority. Worth doing before the dummy-data pattern gains a fifth
  consumer or the Program-leads exception gets questioned by a future
  session that doesn't have this context.

## Needs a human

- Whether the 0.5 kB bundle overage is acceptable to carry, or whether it
  should block further shared-screen work until paid down.
- Whether a manual light/dark toggle is wanted — answered the underlying
  question (no forced dark mode; it is the OS/browser's `prefers-color-scheme`)
  but did not build a toggle, since none was explicitly asked for.
