# D-558 — The super admin has no role switcher, and no "See the app as"

**Date:** 2026-10-10/11 · **Branch:** `claude/pam-super-admin-no-switcher`

Will, 10 October 2026, relayed by the merge desk: "on super admin, we no longer need the
role switcher icon on top right of screen, since we have special storybook prototypes for
each journey to check how the journey is." Asked whether "See the app as" should go too,
Will, 11 October 00:32 UTC (relayed): "remove".

First claimed as D-497 offline, then renumbered by hand to D-501, D-502 and D-503, each found
taken (D-503 is Sage's voice guide). Claimed online as D-558 on 13 October, at push time.

## What changed

1. **The header icon.** The round people icon at the top right of a super admin's screens
   (the `RoleSwitch` dropdown, D-108) is gone from all ten screens that drew it: Requests
   (Home), Everyone, A person, Places, A place, Points, Notifications, Interested, Reported
   places and the request screens. `app/RoleSwitchControl.tsx` and `app/RoleSwitchLazy.tsx`,
   which existed only for it, are deleted.
2. **"See the app as"** (`/view-as/`, D-217). The Profile row, the screen
   (`screens/ViewAsView.tsx`, `app/view-as/`), its prototype route and its story are
   deleted, and its three strings (`profile.menu.viewAs`, `viewAs.title`, `viewAs.intro`) are
   gone from all seven languages and the ledger.

## What stays, and why

- **The stored preview is retired, not kept** (changed 13 October, Mira's check before push).
  `useViewAs` no longer reads `sessionStorage` `pam.view-as`: with no switcher, a tab still
  holding "member" from before would have stranded the super admin in a member's screens with
  no way back. It now clears the key for a super admin and always answers their own role. It
  keeps its shape, so the screens that ask `useViewedRole` / `useRoleView` are unchanged and
  simply get the person's own role. Browser tests that drew a role by setting the key now sign
  in as that role. Storybook's prototype still reads the key to pick a tab bar, inside
  Storybook only.
- **"Use Pam as"** (`/use-as/`, D-374): one account with two roles; not the preview.
- **Program leads' "switch programs"** (D-318): untouched.
- **`@pam/ui/RoleSwitch`** and its stories: the design lane's; now used only by the gallery
  page and stories. A FINDING, not removed here.
- **The database: nothing changes, and there is nothing to contract later.** The preview was
  only ever a browser setting. `set_demo_view` and `profiles.is_demo` belong to a different
  feature, the "demo view" switch on Everyone (D-155), which shows an account the example
  data; it is still in use and is not touched.

## Tested

- `e2e/directory.spec.ts`: "the header has no role-preview switch" fails on `main` (expected 0,
  found 1) and passes after; "a super admin's Profile has Everyone and no See the app as";
  "switching the view never changes whose data is asked for" now sets the stored preview
  directly, since its screen is gone.
- 13 October: a super admin whose tab still holds `pam.view-as` lands as super admin, with no
  switcher, and the key is gone (`e2e/directory.spec.ts`).
