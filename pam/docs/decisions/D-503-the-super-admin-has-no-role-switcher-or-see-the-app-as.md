# D-503 — The super admin has no role switcher, and no "See the app as"

**Date:** 2026-10-10/11 · **Branch:** `claude/pam-super-admin-no-switcher`

Will, 10 October 2026, relayed by the merge desk: "on super admin, we no longer need the
role switcher icon on top right of screen, since we have special storybook prototypes for
each journey to check how the journey is." Asked whether "See the app as" should go too,
Will, 11 October 00:32 UTC (relayed): "remove".

First claimed as D-497 offline; `main` took D-497 the same night. D-501 and D-502 were then
found taken on other branches (Wren's carousel, the sign-in design), so this is D-503.

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

- **The stored preview** (`useViewAs` / `useViewedRole`, `sessionStorage` `pam.view-as`).
  Nothing in the app can set it any more, but every screen still reads it, and Storybook's
  prototype and several browser tests set it directly to draw a role. Taking it out means
  touching every screen that branches on a viewed role: a job of its own, if Will wants it.
  A super admin with a preview already set in an open tab keeps it until that tab closes
  (`sessionStorage` is per tab); Will is the only super admin.
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
