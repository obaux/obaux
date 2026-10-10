# D-497 — The super admin's header has no role switcher

**Date:** 2026-10-10 · **Branch:** `claude/pam-super-admin-no-switcher` (local; see the session log)

Will, 10 October 2026, relayed by the merge desk: "on super admin, we no longer need the
role switcher icon on top right of screen, since we have special storybook prototypes for
each journey to check how the journey is."

## What changed

- The round people icon at the top right of a super admin's screens (the `RoleSwitch`
  dropdown, D-108) is gone from all ten screens that drew it: Requests (Home), Everyone,
  A person, Places, A place, Points, Notifications, Interested, Reported places and the
  request screens. `app/RoleSwitchControl.tsx` and `app/RoleSwitchLazy.tsx`, which existed
  only for it, are deleted.
- The icon opened no screen of its own; it switched the preview in place.

## What stays, and why

- **"See the app as"** (`/view-as/`, a Profile row) stays: Profile still reaches it, and it
  sets the same preview the icon did. Will's reason (Storybook journeys) may apply to it
  too; that is his call, asked in the READY.
- **"Use Pam as"** (`/use-as/`, D-374) stays: it is the switch for one account that holds
  two roles (member and program lead), not the super admin's preview.
- **Program leads' "switch programs" (D-318)** is untouched.
- **`@pam/ui/RoleSwitch`** and its stories stay: they are the design lane's (`packages/ui`,
  `stories/components`), and the gallery page and the AppHeader story still draw them.
  Raised as a FINDING, not removed here.
- The `view.switch` and `view.as` strings stay: the component above still uses them.
- **Database:** nothing. The preview is a browser setting (`sessionStorage`
  `pam.view-as`); no function exists only for it.

## Tested

`e2e/directory.spec.ts`: "the header has no role-preview switch". It fails on `main`
before this change (expected 0 switches, found 1) and passes after.
