# 2026-10-10 — design legal tabs

**Branch:** `claude/pam-design-legal-tabs` · **Lane:** design system & Storybook (Dot)

## What changed

Will's phone test of the Privacy page (Mira's relay): the highlighted tab got confused with two sections in view. D-497.

- `LegalPage.tsx`: the reading position is the last section whose heading has reached the 136px line under the bars
  (the one at the top wins), plus the very bottom of the page; a tapped tab is held until the reader scrolls for
  themselves; the row of tabs moves so the highlighted tab is wholly in view (to its snap point); after a tap, focus
  goes to the section heading (`tabIndex -1`, `preventScroll`).
- `e2e/legal-tabs.spec.ts` (7 tests at 320 and 390 wide); `legal.spec`'s "says where you are" scrolls to the bottom.

## What was wrong, and what missed it

Will's case: "Talk to a person" is the last, short section; with "What you can do" at the top the end of the text was
still on screen, which forced the last tab. D-492's tests covered Back, history and landing position, not which tab is lit.
My first row-follow aimed at the middle of the tab, and the row's own scroll-snap dragged the smooth scroll on to the next
tab: six runs failed, a probe showed `scrollLeft` landing on 134, so the row now aims at a snap point.
I wrote "D-496" in a comment before claiming; the claim came back D-497 (someone had taken 496), so the guess was wrong this
time, and was caught and fixed before the commit. Fifth time on the number rule.

## Decisions made

D-497.

## Verified

legal-tabs, legal, legal-phone and a11y specs: 135 passed (all three projects); tsc; web 93 unit tests; bundle budget
23.5 kB spare; build-storybook. The new spec fails on the old LegalPage (10 of 14). Not run: the whole suite (the merge desk
runs it once per merge, as the team now works). Chromium only; not seen on a phone or in WebKit.

## Left undone

Not seen on Will's phone: iOS's smooth scroll and its toolbar are not in headless Chromium. Terms uses the same page and the same
code; only the privacy notice was tested by name.

## Needs a human

Will to try the tabs on the phone once it is live.
