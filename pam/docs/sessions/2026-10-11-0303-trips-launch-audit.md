# 2026-10-11 — trips launch audit

**Branch:** `claude/places-programs-trips-launch` · **Lane:** Places & programs (Piper)

## What changed

Will (phone, Trips, real account): a drawn map over the real one, example trips shown as his, a policies banner for an example program. Found: `useTrips` and eight other readers always mixed `DUMMY_TRIPS` in. Now one switch, `lib/examples.ts` (D-509): examples only in Storybook, a demo, or an explicit `pam.examples`. Trips, the next visit on Explore (which read only examples; now the member's own), a place's visit, Messages' visit card, Join and New trip (its places are now the member's saved ones) use it. Map: no "Map preview" label unless something is drawn; no pins and a plain ground when empty; the real Google map shows Philadelphia when there are no pins; overprinting pins become one "2 trips". Drawer empty state: "No trips yet" + "Plan a visit and it shows here." Strings: `trips.map.many` (new, with ru/ar plural forms), `trips.empty.body` (shortened).

## What was wrong, and what missed it

Examples were the default for every account (D-172, D-225 meant demos); nothing separated a real account from a demo, and the e2e stubs signed in as a real member and relied on the examples. The Google map is only used with a key, so the drawn preview was what a phone without it showed. Cannot be seen here: a real Google map (no key in the build); what the code does is that Google and the preview are never both drawn.

## Decisions made

D-509.

## Verified

Config 1067, tsc, Storybook build, fit audit on the Trips stories in seven languages plus pseudo: 11 findings, all accepted, 0 new. e2e full run: 1175 passed; only visit-change (walks the example trips; now opts in) and failed-load (D-495, needs the next patch in node_modules; fails the same on main in this tree) failed; new trips-real-account (6 tests: empty drawer, one real trip, Explore, demo opt-in, clustered pins, New trip's places) and visit-change, trip-booked, trips-past, place all pass.

## Left undone

Audit list for Mira below; places, Explore, Saved, programs and the rest of the example readers are the next branch.

## Needs a human

Will: the empty line "Plan a visit and it shows here." (via Mira). Lena: `trips.empty.body` and `trips.map.many` in six languages. Will can cancel his own test trip (Haverford Avenue Library, 12 October) himself.
