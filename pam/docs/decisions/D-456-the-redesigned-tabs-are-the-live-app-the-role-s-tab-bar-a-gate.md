# D-456 — The redesigned tabs are the live app: the role's tab bar, a gate, and the old pages retired where a new screen does the job

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-app-shell`

Will, through the merge desk (10 October 2026): the redesigned screens in Storybook should be what the app
is, not a second app beside it. This is the first part of that: the bottom tab bar, a gate under it, and
the routes behind each tab.

## What was decided

- **One bar, from the root layout.** `AppTabBar` (lazy, `ssr: false`, so it is outside the first-load
  chunk) draws `RoleTabBar` under the five tab screens of whoever is signed in, with that role's own tabs
  (`tabsFor`); a super admin previewing a role gets that role's bar. `tabFor(pathname)` says which tab a
  path belongs to; a screen you tapped into has none, and neither does a signed-out visitor. If the bar's
  chunk cannot be fetched it is not drawn, and the screen stays up.
- **A gate on every tab screen** (`TabGate`): loading, signed-out (sent to Sign in), error, paused and
  no-profile are each answered, and each carries the Help bar (§0). The first version had none and the
  loading and a11y specs caught it.
- **Routes.** `/`, `/saved/`, `/trips/`, `/program/`, `/programs/`, `/profile/` (new) and `/messages/`
  draw the redesigned screens; `/admin/` is Invite someone (D-218); `/reminders/` lands on `/`;
  `/account/` is Profile for a signed-in person and keeps its own words for loading, signed-out, error,
  paused and no-profile (a paused account must still be told so and be able to sign out).
- **Old pages kept, on purpose:**
  - `/places/` — `?filter=reported` is a notification's deep link and the new Explore has no Reported.
  - `/interested/` — main's wording fix landed there; nothing replaces it yet.
  - **Messages for case managers and super admins** (`LegacyMessagesPage`) — the redesigned list has no
    Reported conversations, which staff need. Members and program leads get the new screen.
- **The view switch reaches the whole page.** `useViewAs` told only the hook that was changed; Home picks
  its arrangement in one hook and the switcher sat in another, so a super admin who chose Case manager
  kept seeing Requests under a "Viewing as Case manager" chip. It now says so on `window`.
- **A case manager's Home keeps "What you can see"** (§4.1), which only the retired `/admin/` page carried.
- **First-load stays inside §12** (600 kB gzipped): 572.4 kB. To get there the staff Homes
  (`StaffHomes`) and `RequestsScreen` load only for the people who see them, and `CategoryPicture` was
  pulled out of `SavedView`.

## What a later session might want to reverse

- Retiring `/places/`, `/interested/` and the legacy Messages once the new screens have Reported
  (Piper: reported places; Nico: Messages).
- The people strip (D-198 rings) is not on the new caseload and program Homes. That is a question for
  Will, not settled here; its five e2e tests are left as they are until he answers.
