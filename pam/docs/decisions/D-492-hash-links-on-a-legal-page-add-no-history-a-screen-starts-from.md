# D-492 — Hash links on a legal page add no history; a screen starts from the last known session

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-phone-bugs`

Will, 10 October, testing the live app on his iPhone, found four things; Mira relayed them.

**Found, and the one cause behind three of them.**

1. *Back on a policy screen did not return to Sign in; the tabs glitched; "Back to top"
   stopped short.* The section tabs and "Back to top" were plain `#hash` links. A hash
   link adds a history entry, so Back (D-250's `goBack`, `history.back()`) undid a tab tap
   and stayed on the page. "Back to top" pointed at `#top`, the page title, which sits in
   the sticky bar and is always in view: the browser scrolled 92px and stopped.
2. *The loading screen showed the old page behind the new layout.* `TabGate`'s loading
   state drew the old chrome (Pam logo bar, full-width Help block) with no tab bar, then the
   new layout arrived.
3. *A super admin's Profile flashed a member's profile.* Every screen calls `useSession`
   for itself and began at `loading`; a screen mounted after the gate had let it through drew
   its "nobody yet" default (role `member`, no name) until its own answer came.

**Decided.**

- A tab tap scrolls its section to 136px (the two bars and air) itself and adds nothing to
  history; the anchor stays a real link for anyone without script. "Back to top" is a
  button that scrolls to 0. Smooth unless the phone asks for less motion. The row of tabs
  follows sideways on its own scroller so the page's scroll is not interrupted.
- The loading state uses the new layout's bar: a hidden "Loading" title, the round Help
  button, the spinner. Help is still there (§0, never a dead end); the old logo and Help
  block are gone from it.
- `useSession` keeps the last signed-in answer for the tab and a new screen starts from
  it, asking again in the background. Cleared on sign-out, on a different person, on a
  refresh, and on any answer that is not signed in. A new instance starts knowing that user,
  so supabase-js's `SIGNED_IN` for the same person is not news.

**Checked.** `e2e/legal-phone.spec.ts` (Back after tab taps, heading position and no history,
Back to top) and `e2e/shell-flash.spec.ts` (loading is the new bar; no member frame on a
super admin's Profile), each failing on the code before and passing after. Chromium only:
WebKit is not installed here.

**A later session might reverse:** the cache, if a real second account can be signed in
within one tab without a reload (today sign-in is a reload). The no-profile, error and
suspended screens still use the old chrome; only loading was moved.
