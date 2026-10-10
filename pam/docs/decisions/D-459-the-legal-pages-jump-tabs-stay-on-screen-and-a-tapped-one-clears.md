# D-459 — The legal pages' jump tabs stay on screen, and a tapped one clears the header

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-legal-tabs`

Will, 10 October 2026: "Legal pages design using tabs to jump to text need offset so header isn't
covering title. We also need tabs to be sticky on top for easy navigation."

## What was wrong

`LegalPage` (Privacy and Terms) has a row of pills that jump to a section (D-417). The row scrolled
away with the page, so jumping to a second section meant scrolling back up first. And a tapped pill
scrolled the section to 16px from the top of the screen, which is under the header bar (64px) that
`SubPage` keeps on screen, so the section's heading was hidden by it.

## What was decided

- **The row is sticky**: `position: sticky; top: 64px` (directly under the header bar, whose own
  `bar` is 64px and `z-index` 5), `z-index` 4, in the page's colour and out to the screen's edges, as
  the bar is, so the text scrolling beneath it does not show through.
- **A section's scroll margin is 136px**: the header bar (64px) + the tab row (56px: 6px above the
  40px pill, 10px below) + 16px of air. A tapped tab lands the heading at 136px, clear of both.

## Measured, not assumed

In a real browser at 390px and 320px, both documents, light and dark: scrolled 1400px down the tab row
is at 64px, the header bar's bottom edge is 64px, and for the first, third, middle, second-to-last and
last tab the heading lands at 136px against a tab row that ends at 120px. The last section lands lower
(331 to 356px) because the page runs out of room to scroll; it is still clear. The legal browser spec
(26 tests including the WCAG A/AA checks, at 320px light and dark) passes, and the fit audit finds 0
new defects on the privacy, terms and legal pages in all seven languages.

## What a later session should know

- The 64 and 56 are the two bars' heights, written as numbers because StyleX needs them at compile
  time. If `SubPage`'s bar (`minHeight: 64px`) or the pills (`40px` and the 6px/10px padding) change, the
  `top` and the 136px change with them, or the heading goes back under a bar.
- A header bar that grows (a long title wrapping) is not handled: today its title is one line.
- Not done, and not asked for: the same offset for other pages that jump to a section. This is the
  only page with a jump row.
