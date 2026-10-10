# 2026-10-10 — design phone bugs

**Branch:** `claude/pam-design-phone-bugs` · **Lane:** design system & Storybook (Dot)

## What changed

Four things Will found on his iPhone on the live app (Mira's list, 16:45). D-492.

- `LegalPage.tsx`: a tab tap scrolls its section to 136px under the bars itself and adds no history entry;
  "Back to top" is a button that scrolls to 0; the tab row follows sideways on its own scroller.
- `useSession.ts`: a new screen starts from the last signed-in answer in the tab (and knows that user, so
  supabase's `SIGNED_IN` for them is not news) and still asks again.
- `TabGate.tsx`: the loading state is the new layout's bar (hidden "Loading" title, round Help) and the spinner,
  not the old logo bar and full-width Help block.
- e2e: `legal-phone.spec.ts` (3), `shell-flash.spec.ts` (2).

## What was wrong, and what missed it

(a) Back on a policy screen: not the `from=signin` logic. The tabs were `#hash` links, each adds a history
entry, so `goBack`'s `history.back()` undid a tab tap. `legal.spec` only went Sign in to the page and Back,
never tapping a tab first. (c) "Back to top" linked to `#top`, the title in the sticky bar, which is always in
view: it stopped 92px short. (b) the tab taps fighting the sticky bars was the same native hash jump.
(2) the loading state was the pre-redesign chrome. (3) every `useSession` starts at `loading`; ProfileScreen's
own instance defaulted to `member` while the gate's was already signed in. My first fix of (3) still flashed:
a new instance had no known user, so supabase's `SIGNED_IN` looked like a different person, reset to loading
and wiped the cache. The test caught it (3 frames), a probe found the cause.

## Decisions made

D-492.

## Verified

Each new test fails on the old code (6 of 6 in shell-flash; Back, history and top in legal-phone) and passes
after, in all three projects. tsc; bundle budget 23.9 kB spare; full Playwright suite (see the READY).
Chromium only: WebKit is not installed in this container, so Safari's own scroll behaviour is not seen.

## Left undone

No-profile, error and suspended still use the old chrome (only loading moved). The sticky-tab glitch is
reproduced as history and landing position, not as a visible flicker: headless Chromium does not show the
iOS toolbar resize. Needs Will to try on the phone.
Figma map: "Proposed (a22)" card to the real screen, then the drawer drag action (Mira's order).

## Needs a human

Will to try the legal tabs on his phone once this is live.
