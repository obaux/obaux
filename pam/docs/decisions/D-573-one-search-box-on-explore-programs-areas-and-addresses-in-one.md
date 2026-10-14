# D-573 — One search box on Explore: programs, areas and addresses in one list

**Date:** 2026-10-14 · **Branch:** `claude/places-programs-one-search`

**Decided:** Will, 14 October 2026 (card a86): "Why do we need to make a distinction?" between a program and an area; keep the "Near ZIP ✎" control; 05:21 "Keep placeholders text simple"; and, at 06:45 after trying street search live: "when users use the main search on app, no pop up opens, and instead they see the programs listed by the address or name they're curious. The goal here is to provide a superior search experience, but only show what we have in database, mapped to google. Remove the dropdown, and instead only show our list of places."

**What.** Explore's search is one inline field (and the same field on staff's All programs, on its own row under Back, Add and Help). Nothing opens: no pop-up, no dropdown, no full screen, no Cancel. Typing filters the list right under it (programs by name or address); the clear (×) inside the field empties it and keeps the keyboard up. **Only Pam's programs ever show.** The "Near ZIP ✎" control and its drawer are not changed by the main search.

**A typed address.** When the words read as an address or a corner and no program of any kind matches them, Pam's server turns them into a point (`places-search`: autocomplete, then the details of the first suggestion: the same two calls and the same host as the drawer, no new action) and the list is Pam's programs nearest that point, closest first, from `services_near`. One quiet line says so with the ZIP only (D-552): "Nearest to 19102", with Google's mark under it where its answer shaped the list. Nothing else from Google is shown. The point is held in the hook's memory only (`useAddressOrigin`): never in localStorage, the profile, a URL, or a request to Pam's server beyond the list's own POST body, like "near you". Nothing is asked automatically for program words.

**The privacy rule (the part to keep).** `wantsGoogleFromBox`: address-like AND the programs search (every kind, not the chip's) answered successfully with nothing. A slow or failed programs search counts as "a program might match": nothing is sent. No tap is needed now (the explicit "Search addresses" row of the first build is gone). The drawer keeps D-552's rule (which also asks when Pam's list of areas has nothing) and its own Google pick flow.

**Replaces** the full-screen search with sections, the launcher, and the typeahead pill on Explore. Chips, hide-on-scroll and the Near control are as they were.

**What a later session might reverse.** The quiet line and Google's mark under it; distance from the point as the only "mapping" (Pam's places already have coordinates; Google place IDs are not stored, the Places terms limit caching them).