# D-509 — real accounts never see example trips, visits or policies

**Date:** 2026-10-11 · **Branch:** `claude/places-programs-trips-launch`

## Decision

Will, 11 October 2026, with a phone screenshot of Trips on a real account: "The fake map is overlaying the real map, and I haven't signed up to any trips, but it shows I did. Also no programs should have policies since nobody added any real programs yet. Let's show an empty state inside drawer here. Don't be too wordy." Mira then made it the rule for the whole app at launch: a real account sees only its own things.

**When examples show** (`lib/exampleMode.ts`): only in Storybook's clickable prototype (which answers Supabase itself and marks `window`), in a demo (a super admin previewing another role, `pam.view-as`), or when a tab asks for them outright (`sessionStorage['pam.examples'] = '1'`, which the end-to-end tests that walk the example trips set). Every other account, signed in as anyone, sees none. D-172 and D-225 made the examples for demos and investor walk-throughs; nothing said a real member should see them, so this narrows them to that.

**Trips.** `useTrips`, Home/Explore's next visit, a place's visit, Messages' visit card, Join's booked visit and New trip all read the example trips through `exampleTrips()`, empty for a real account. Explore's next-visit card now reads the member's own next trip (saved, moved) — it only ever read the examples before. New trip's "where" step lists the member's saved places, not the nine example ones. The "Sign N policies" banner comes only from real policies on real trips (the program has put none: 0 today).

**The map.** The drawn preview is never the map of a real account with nothing to show: with no trips it is a quiet plain ground with no label and no pins; with Google loaded and no trips, the real map shows Philadelphia with no pins. "Map preview" is said only when something is drawn. Pins that would overprint (a name is up to 120px wide) are one pin, "2 trips".

**The drawer.** Empty: "No trips yet" and one short line, "Plan a visit and it shows here." (`trips.empty.body`, shortened; the six other languages are drafts for Lena). "+ New trip" stays at the top.

## What a later session might reverse

The example set could be offered in a deliberately labelled "Try Pam with examples" mode; this only makes it opt-in. The rule is being extended screen group by screen group (places, Explore, Saved, programs, Messages is Nico's).
