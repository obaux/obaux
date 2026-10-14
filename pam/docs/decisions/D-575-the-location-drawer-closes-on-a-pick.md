# D-575 — The Location drawer closes on a pick

**Date:** 2026-10-14 · **Branch:** `claude/places-programs-drawer-closes-on-pick`

**Decided:** Will, 14 October 2026, 06:45, after trying street search live: "when I select a result, it should close the drawer with the new zipcode input into place."

In the Location drawer (the area picker behind "Near …"), picking any result (a ZIP, a neighborhood, City Hall, a Google address, or Use my current location) closes the drawer at once and puts the new value on Explore's Near control; a street shows only its ZIP (D-552). There is no Done: its place at the top right is **Cancel**, which leaves the area as it was, as do Escape, a swipe down and the scrim.

**Replaces** the held choice of D-275 ("The choice is held until Done"). Nothing else in D-275 changes: the cursor is in the box, current location is first, the chosen row is bold with a tick. `places.area.done` is still used by the policy screen; it is no longer used by the drawer.

**Why.** Pressing Done after a pick was a step nobody expected; the pick is the answer.

**What a later session might reverse.** Cancel in the corner (a visible way out; the scrim and Escape also work).
