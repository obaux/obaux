# D-536 — The browser no longer asks the city about a typed street address

**Date:** 2026-10-11 · **Branch:** `claude/places-programs-no-city-call`

**Decided by:** the merge desk (Mira), 11 October 2026, on Lena's finding; Will can reverse it. (Mira called it D-535 in her message; D-535 had already been taken by "I'm here", so this is D-536.)

## What was wrong

`useAreaSearch.ts` sent a GET to `https://phl.carto.com/api/v2/sql?q=…` with the part-typed address in the URL as soon as what a member typed looked like a house number and a street, on every 200 ms pause. The City of Philadelphia's server got the partly typed address and the phone's IP address, and the City keeps its own logs. Privacy said nothing about it. The file's comment and D-054 said the text "does not go to Pam's server", which was also not true: the same keystrokes go to `search_areas`. Where a person is staying is the fact this audience most needs to guard.

## What changed

- The browser no longer calls any City host. `searchCityAddresses` and its call are gone; `search_areas` (the ZIP codes and City Hall; it matches labels, and the table has no neighbourhood rows yet) always answers. What is typed goes to it as a POST body, which neither the gateway nor Postgres logs, and nothing is stored (checked on the live project, D-535).
- "Use my current location" is no longer saved (Lena's review): `saveOrigin` writes nothing for the phone's own position and `loadOrigin` deletes one that an earlier version kept, so `places.area.hereNote` ("Used for this search only.") is true and the next visit starts from the last chosen area or City Hall, not a days-old position labelled "your location". Test: `areaOrigin.test.ts`.
- The picker's words no longer promise a street address: the label is "ZIP code", the hint "Like 19107.", and the line under it "Pam remembers the area you pick on this phone only." (signed by Sage; the six translations are Lena's, branch `claude/lena-picker-strings`). The list has ZIP codes and City Hall only, so no neighbourhood is promised until some are seeded.
- A member's first name no longer rides in an address (`/person/policies/?id=…&name=…` landed in the host's request records and in browser history). The person's page leaves it in the tab (`personNames.ts`, sessionStorage) and the policies page reads it there.
- The Google map in Trips (`TripsMap.tsx`) opens on the whole city (`setCenter(CITY)`, zoom 12) and is never fitted to the member's trips: the tiles Google serves are the part of the map in view, so a view fitted to one trip is a single block, and with the phone's IP address that says roughly where the member is going. The pins are still placed (Google gets no name, time or id of a trip). The view is nudged down 20% of the screen height (`panBy`) so the half-open drawer does not sit on the middle of the city; I could not look at a real Google map here (no key in this container), so check pins near City Hall at 390 and 320. If a member zooms in, that is their own choice. The drawn preview (no key) is unchanged.
- Tests: no app source names a City host, the area search makes no `fetch`, and an e2e types "1234 Market" and watches that nothing leaves for the City.

## D-054

D-054's "never sent to Pam's server" was inaccurate; what is true is in `useAreaSearch.ts` now.

## Later, not now

If street-address search is worth bringing back, do it through Pam's own server: a Supabase function takes the text in a POST body, asks the City, returns only a label and coordinates, and logs nothing. The City then never sees a member's phone. Lena will say whether Privacy then needs a line.
