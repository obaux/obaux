# 2026-10-10 — Accounts & invites: no role switcher for the super admin

**Branch:** `claude/pam-super-admin-no-switcher` (from `main` at `3f0bb5e1`; local, not pushed) · **Lane:** Accounts & invites

Will, 10 October, relayed by the merge desk: "on super admin, we no longer need the role
switcher icon on top right of screen, since we have special storybook prototypes for each
journey to check how the journey is."

## What changed

- The `RoleSwitch` icon (D-108) is removed from the headers of Requests (Home), Everyone,
  A person, Places, A place, Points, Notifications, Interested, Reported places and the
  request screens. `app/RoleSwitchControl.tsx` and `app/RoleSwitchLazy.tsx` are deleted;
  `setViewAs` dropped where nothing else used it; a stale comment in `HeaderBell.tsx` fixed.
- New test in `e2e/directory.spec.ts`: the super admin's Everyone header has no switch.
- D-503, a changelog fragment, this log, a STATUS section.

- **Later, 11 October (Iris's member flow, relayed by Mira):** W2 — sign-up step 2 ("What
  others can see") now has a Call Pam row (the support number from `app_settings`, the hours,
  one tap to dial), and `e2e/join.spec.ts` checks it. Its missing back arrow is deliberate (the
  account and the used invite exist by then, so going back to About you would fail on
  resubmit); asked, not changed. W6 — first-time words drafted for Will, not built.

- **"See the app as" removed too** (Will, relayed, 11 October 00:32: "remove"): the Profile
  row, `/view-as/`, its screen, route, story and three strings in all seven languages. The
  stored preview stays (tests and Storybook set it). Mira's note named `set_demo_view` /
  `demo_view` as its database side; they are the Everyone demo-view switch (D-155), a
  different feature, still in use, untouched.
- **Renumbered D-497 → D-503**: the offline claim collided with `main`'s own D-497, which
  the numbering test caught after merging `main`.

## What was wrong, and what missed it

- **The first version of the new test passed on `main` too.** The switch is loaded lazily
  after the session, so "count is 0" was true before it arrived. Found by running the test
  against a build without the change; fixed by waiting for the page to settle. Now it fails
  on `main` (expected 0, found 1) and passes here.
- **Typecheck first reported errors in `apps/site` and in `.next/types`.** Neither was this
  change: `apps/site` is new on `main` and needed `pnpm install`; `.next/types` was left by
  the D-446 branch's build. Clean after both.

## Decisions made

- D-503 — remove the header icon; keep "See the app as", "Use Pam as" and `@pam/ui/RoleSwitch`.

## Verified

| Check | Result |
|---|---|
| `pnpm -r typecheck` | 6/6 clean |
| `@pam/web` / `@pam/ui` / `@pam/config` unit | 93 / 117 / 1060 pass |
| `pnpm --filter @pam/web build`, bundle | builds; 24.3 kB under budget |
| Playwright: directory, admin, people-strip, place, places, points, staff-home, staff-request-approve, a11y, back, shell-flash | 264 passed (320 light and dark, iPhone SE) |
| New test against `main` without the change | fails (expected 0, found 1) |
| `build-storybook` | builds; super admin headers photographed before and after |
| After W2 and merging main (11 October): typecheck; Playwright join, consent, a11y, directory | clean; 192 passed, then join 36 with the new check |

## Left undone

- **Not pushed.** This session may push only to `claude/pam-assign-and-limit` (D-446, READY
  and frozen); a new branch needs Will's word.
- **"See the app as"** (`/view-as/`) is the same preview by another door; Will's reason may
  cover it. Asked, not removed.
- **`@pam/ui/RoleSwitch`**, its story and the AppHeader story are the design lane's; now used
  only by the gallery page and stories. FINDING for Dot.

## Needs a human

- Where to push this branch, and whether "See the app as" goes too.
