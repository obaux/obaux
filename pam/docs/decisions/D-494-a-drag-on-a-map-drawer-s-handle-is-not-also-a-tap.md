# D-494 — A drag on a map drawer's handle is not also a tap

**Date:** 2026-10-10 · **Branch:** `claude/pam-design-flow-map-3`

Found while giving the user-flow map a drag action (Mira, 10 October: "Trips with a past visit" lacks the past
visit because the generator cannot drag the drawer).

**What was wrong.** `MapDrawer`'s handle ignored the click that a *mouse* drag ends with by checking
`dragHeight === null`. But the pointer-up clears `dragHeight` before the click arrives, so the check was
always true and every drag ended with a tap: dragging the drawer up to full stepped it on to the dock again.
A finger does not do this (a touch drag fires no click), which is why it was never seen on a phone; a mouse,
a trackpad and the map generator do.

**Decided.** The handle remembers that a drag happened (a ref set on the first move past 4px, cleared on the
next press) and the click after it is not a tap. `e2e/trips-past.spec.ts` drags the handle with the mouse:
it fails on the old drawer (the handle still says "Show more of your trips") and passes after.

**And the map.** The generator gains two `actions`, usable by any screen: `{ drag: name, dx?, dy? }` (press
on it, move, let go: a drawer or sheet) and `{ scroll: name | 'page', by }`. "Trips with a past visit" now
drags the drawer open. No special story.

**A later session might reverse:** nothing; the guard's intent ("only a tap should step") is kept.
