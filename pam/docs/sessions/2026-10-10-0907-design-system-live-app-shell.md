# 2026-10-10 — Design system & Storybook (Dot): the live app shell

**Branch:** `claude/pam-design-app-shell` · **Lane:** Design system & Storybook

Mira's first priority for the lane: mount the redesigned role tab bars in the real app, route the
redesigned screens, retire old pages only where a new screen does the same job, keep deep links, stay inside
the 600 kB first-load budget, READY in parts. D-456.

## What changed

- **The bar and the gate.** `RoleTabBar` (was the stories' `LocalTabBar`, which now re-exports it),
  `AppTabBar` + `AppTabBarLazy` in the root layout, `TabGate` under every tab screen, `tabFor(pathname)`.
- **Routes.** `/`, `/saved/`, `/trips/`, `/program/`, `/programs/`, `/profile/` (new), `/messages/`
  draw the redesigned screens; `/account/` is Profile when signed in and keeps
  its own words for the other states; `/reminders/` lands on Explore.
- **Kept on purpose:** `/places/` (the `?filter=reported` notification link), `/interested/` (main's wording
  fix), and Messages for case managers and super admins (`LegacyMessagesPage`, because the new list has no
  Reported).
- **Budget.** The staff Homes (`StaffHomes`) and `RequestsScreen` load only for the people who see them,
  and `CategoryPicture` is out of `SavedView`: 606.3 kB first came out over; now **572.4 kB** gzipped of 600.
- **Found while rewriting the specs:** `useViewAs` told only the hook that changed, so a super admin who
  chose Case manager kept seeing Requests; it now broadcasts on `window`. A case manager's Home had lost
  "What you can see" (§4.1) with the old `/admin/`; it is back, same words. A tab bar whose chunk cannot load
  took the page down (`languages.spec.ts`); it is now simply not drawn.
- **Mira's decision, after the first READY draft: case managers and program leads keep the OLD Home**
  (`LegacyHome`, restored from `main`, with `/admin/` and the `HomePeople*` files) until the rings are on
  the new staff Homes. The five people-strip specs pass untouched; `admin.spec` is `main`'s again.
- **Specs rewritten** for the screens that now do the job: `account`, `saved`, `points`, `directory`,
  `admin` (the invite flows moved to `/invite/new/`), `consent`.

## What was wrong, and what missed it

- **No Help bar on the gate's non-ready states** (§0). The a11y and loading specs caught it, not me. All
  states carry it now.
- **I first swapped pages whose old behaviour was a contract**: `/places/` (the Reported deep link),
  `/account/` (a paused account would have been trapped without its notice), `/messages/` (staff lost
  Reported), `/interested/` (a merge conflict with main's wording). Each was found by asking what links to
  it, then reverted or kept.
- **I said the first first-load number was fine and it was 606 kB.** The budget script is the check.
- **`pkill`-style shortcuts and stale `.next/types`** cost time again: `rm -rf apps/web/.next apps/web/out`
  before type-checking another branch's tree.
- **Playwright here wants `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`**;
  the installed Playwright (1.63) otherwise looks for a build this container lacks.

## Decisions made

- D-456 — the redesigned tabs are the live app (above), with the old pages kept where they still do a job.

## Verified

| Check | Result |
|---|---|
| `pnpm build`, `tsc --noEmit`, `pnpm test` (web) | clean, 61 pass |
| First-load budget (`scripts/check-bundle-budget.mjs`) | **572.4 kB gz of 600**, 27.6 to spare |
| Playwright, whole suite, narrow-320, on the merged tree | 279 pass; 8 fail: 5 people-strip (held, below), 2 consent and 1 languages (both fixed after, and re-run: pass) |
| Playwright per file, all three projects | `saved` 21/21, `directory`, `admin` 57/57, `languages`, `consent`, `points` pass |
| `build-storybook` | passes |
| `audit:fit --known` full, 497 stories × 7 languages | 32 new in a language, 27 accepted, **5 not**: 3 are the new Block conversation stories (`blocked-by-me`, `blocked-me`), 2 are `saved-trips--one-trip-saved` whose key carries the clock minute (12:04 against 12:00). None is in a screen this branch changed |
| Playwright at phone size per role on the built app | **not run** beyond the specs above |

## Left undone

- **People strip.** D-198's rings are not on the new caseload and program Homes; Mira has asked Will. Until
  then staff keep the old Home (above) and the five `people-strip.spec.ts` tests pass untouched.
- The 5 fit entries above: not mine, not accepted.
- Reported places (Piper) and Reported conversations (Nico) need a home in the new screens before
  `/places/`, `/interested/` and the legacy Messages can go.
- `Trips` is the example set until Piper's real trips land.

## Needs a human

- Will: rings on the people strip, yes or no (asked by Mira).
- Mira: READY in parts, starting with the bar, gate and routes.
