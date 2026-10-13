# D-552 — Street search through Google, from Pam's server

**Date:** 2026-10-13 · **Branch:** `claude/places-programs-street-search`

**Decided by:** Will, 12 October 06:05: "Isn't it better to use Google Maps api for this? City data hub sucks." The merge desk (Mira) agreed and
set the plan. This replaces the City street-centerline idea (card a74 closed): Google finds corners and places by name, which a
centreline file cannot.

## What it does

The area search ("Near …") on the places screen keeps Pam's own list first (ZIP codes, neighborhoods, City Hall). Google is asked, through
Pam's `places-search` edge function, only when what was typed

- starts with a number and a street ("1500 Market"), or
- looks like a corner ("Broad and Erie", "Broad & Erie", "Broad/Erie", "Broad at Erie"), or
- has no match in Pam's list ("Temple Hospital").

Never for fewer than three characters or a bare number (a ZIP code), only after a 400 ms pause, one question at a time. Google's rows come
below Pam's, with Google's required mark ("powered by Google", a text placeholder until Dot adds Google's own asset).

## How it is kept private (a67 line 2 stays true: the map is the only thing the phone loads from Google)

- The phone never calls Google for this. It calls `places-search` (signed-in only).
- The function asks Google Places (New) from Pam's server: Autocomplete with the typed words, a random per-search session token the phone
  made up, and a box around Philadelphia; then Place Details asking only for the location and address. Google is never told a member id,
  name, phone number or the phone's IP address.
- The function logs nothing typed and stores nothing; a place Google puts outside the box is dropped; a member who asks more than 40 times
  a minute is slowed (the key's daily quota is the real ceiling).
- **Off until the key exists.** No `GOOGLE_MAPS_SERVER_KEY` → `{ enabled: false }`; the app stops asking for the session; Explore and
  Places keep ZIP and neighborhood search, with no error.

## A picked address is never kept (Mira, 13 October, on Lena's question)

A place picked from Google's suggestions is used for that search only, exactly like "Use my current location" (D-536): `saveOrigin` writes nothing for it
(`google:` ids), so it is not in the phone's storage (`pam.origin`), not on Pam's server, and not in a URL; the next visit starts from the last Pam area
or City Hall. A typed street address is often someone's home, the most sensitive thing a member can type here. Pam's own areas (ZIP, neighborhood, City
Hall) are remembered as before. Pinned by `areaOrigin.test.ts` and the street-search e2e (reload goes back to City Hall). What is typed reaches
`places-search` as a POST body, never in a URL or query string. So Privacy can say: Pam does not keep what you type or what Google answers; what Google keeps is up to Google.

## Cost (from Google's pages as search results showed them; Google's own hosts are blocked here, so Will checks the live list on his card)

Since 1 March 2025 each SKU has its own free monthly amount: 10,000 Autocomplete requests and 10,000 Place Details (Essentials). A
session that ends in a Place Details call asking for Essentials fields makes its first 12 autocomplete calls billable per request
(about $2.83 per 1,000 above the free 10,000) and the rest free; ending in the IDs-only call would bill every call, so it asks for
`location,formattedAddress`. At three or four calls a search that is about 2,500–3,000 searches a month free. Pam's "no match in my own
list" rule adds some calls for words Pam's list does not know.

## Terms to keep

Predictions shown without a Google map need Google's logo inline with the results. Coordinates may be cached at most 30 days; Pam stores
none (the chosen area stays on the phone, as before).

## What is still to do before it goes on

Will makes the key (restricted to the Places API (New), a daily quota cap) and enters it as `GOOGLE_MAPS_SERVER_KEY`; Lena writes the
Privacy line (what is typed goes from Pam's server to Google), Sage edits, Will signs; Dot adds Google's mark. The hint under the field
("Like 19107, or Fishtown.") should then also say an address can be typed: Sage's words. The function is deployed with JWT verification ON.

## Words, mark and a status question (13 October, after Sage, Lena, Dot and Will)

- With a key, the field says an address works: `places.areaLabel.street` "ZIP code, neighborhood or address" and `places.areaHint.street` "Like 19107, Fishtown, or Broad and Girard." (a corner, never a house number). Without one, the old label and hint stay. The sheet learns whether there is a key from a third function action, `status`, asked once when it opens (it asks Google nothing and is not counted as a search).
- Google rows say "Used for this search only." (`places.area.hereNote`, as "Use my current location" does), because a Google pick is never kept. The footer "Pam remembers the area you pick on this phone only." stays: it is true for Pam's own areas.
- The mark is Google's "Google Maps" logo (Dot, D-557: files from Will, served by Pam, 18px, Google's clear space), the words "Google Maps" until the files arrive; the mark and the footer line are centred (Will, 13 October).
- Lena's `street-search-line.test.ts` holds the function and the phone's storage to the p7 line (a pick never reaches `pam.origin`).
