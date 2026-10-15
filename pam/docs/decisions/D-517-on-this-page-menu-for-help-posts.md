# D-517 — On this page menu for help posts

**Date:** 2026-10-11 · **Branch:** `claude/compassionate-bohr-mzrchf`

**Decided by:** Will, 11 October 2026, 02:49 UTC (via the merge desk): "We also need a scrollspy for the posts that connects to headers. Scrollspy labels should be summarized but informative. And have the UX TEAM check usability for glitches and correct scroll jumping per section so everything is visible and is easy to navigate."

**What.**
- Every help post has an "On this page" menu built from its own headings (`Section` in `components/Prose.tsx`), plus a closing "Still stuck?". The menu is read from the post's element at render (`lib/sections.ts`), so it is in the first paint; a post that builds a section inside another component is found in the page after it loads. `Section` takes an optional `short` label (a few words that sum the section up); without one the menu shows the heading. **Sage writes the short labels** (none written yet: the menu shows the headings).
- 1180px and wider: a column beside the post that stays in view. Narrower: a bar stuck to the top ("On this page" and the section you are in) that opens a list.
- The section you are in is the last heading above a line below the top of the screen (below the bar, on a phone), found by an IntersectionObserver when a heading crosses it; no scroll listener does layout. `aria-current="location"` marks it.
- A tap scrolls the heading to just below the bar: each section carries `scroll-margin-top` (`--post-scroll-offset`: 80px under 1180px, 24px above), smooth unless the person asked for less motion, the address follows (`#id`), and focus moves to the section. The phone list closes first and the page is let settle before scrolling (a list closing above the target moved it, and the heading landed under the bar).
- The tapped section stays marked until the person scrolls by hand (wheel, finger, keys): the last sections of a short post cannot reach the top, and the mark must not fall back to the one before.
- `scripts/scrollspy.mjs` (browser, built site): every link of every post, at 320, 390 and 1280px, with reduced motion and with smooth scrolling (`SMOOTH=1`): the heading fully on screen and below the bar, the tapped link `aria-current`, the address and focus followed, no sideways scroll, and the first section marked at the top.

**Not done.** Iris's usability pass. The short labels (Sage). A table of contents inside Storybook's story is not separately tested.

**What a later session might reverse.** The 1180px breakpoint and the 860px column beside the menu (the post was 920px alone); the 80px offset (the bar is 57px).
