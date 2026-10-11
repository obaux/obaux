# D-529 — the thread header is a small bar, and who they are scrolls with the messages

**Date:** 2026-10-11 · **Branch:** `claude/messages-thread-header-back`

**Will, 11 October 2026**, through Mira: "Also bring back the header for message thread, it's using the nested page templates. We need the one that scrolls and shows info on top, smaller." Confirmed by Mira on the screenshots (390 wide, light and dark): the small pinned bar, 22px name, 56px photo, the visit card scrolling away.

## Decision

- **A pinned bar, the real one.** `SubPageHeader` takes `variant="bar"` (@pam/ui, a small addition; Dot told): the sticky bar alone, so back and ⋯ land on exactly the same pixels as every other page, by construction. D-411's reason holds; its test (back equals Legal's back, ⋯ at the bar's right edge, outlined and lifted) stays.
- **Who they are scrolls.** `ThreadIntro` is the first thing in the messages' scroll region: their photo (56px), their name (22px, the screen's one `h1`), who they are on a line (D-187, D-395; nothing for staff looking at a member), and for a member with a program the visit card (D-276). It scrolls away with the messages. It replaces D-411's 34px name and D-400's pinned visit card (the card now scrolls; it cost about 56px of a phone's conversation while pinned).
- **The name is said once.** The bar's name is clear while the intro's is on screen and fades in as that one scrolls under the bar (IntersectionObserver on the `h1`, 76px root margin; opacity only, so nothing moves; 240ms, Pam's enter easing; at once under reduced motion). The bar's copy is `aria-hidden` always, so a screen reader hears the `h1` once.
- **No fade** under the bar (D-411 kept).
- **The line under the name wraps rather than being cut.** D-400 cut it at one line because it was pinned and short of room. In the scrolling intro it has the room, and Pam's rule is that text wraps and grows rather than being cut.

## What this changes

D-193 (one row), D-395/D-400 (the line and the card in the pinned header) and D-411 (the large title in a conversation) are superseded for the conversation; the rest of D-411 (⋯ outlined, rows flush left, nothing chosen in dialogs) stands. The compact variant of D-213 does not come back: `bar` is the bar of the same template.

## What a later session might reverse

Pinning the visit card again, if the 56px is wanted back or the card is missed once scrolled. The photo is the only new element (Will's note says "info"); remove it if he did not mean one.
