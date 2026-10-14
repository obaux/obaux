# D-573 — One search box on Explore: programs, areas and addresses in one list

**Date:** 2026-10-14 · **Branch:** `claude/places-programs-one-search`

**Decided:** Will, 14 October 2026 (cards a86, relayed by the merge desk): "Why do we need to make a distinction?" between a program and an area; keep the "Near ZIP ✎" control ("I don't think we need to get rid of this feature"); 05:21: placeholder "Search programs", no explainer text, "Keep placeholders text simple."

**What.** Explore's search is one box. The launcher ("Search programs") opens a full screen with the cursor in the box. One list as you type: Programs (by name or address), Areas (Pam's ZIPs, neighborhoods, City Hall), Addresses (Google, with its mark and "Used for this search only."). Only digits typed: Areas first. Before anything is typed: "Use my current location". A program opens its page; an area or an address goes back to Explore and sets the "Near …" control, which stays beside the heading with its drawer, unchanged. A picked street shows only its ZIP on the control (D-552). Staff's All programs opens the same screen from its round search icon.

**The privacy rule (the part to keep).** The box asks Google ONLY when the words read as an address or a corner AND no program matches them (the programs search has answered, successfully, with nothing), or when the person taps "Search addresses for …", which sends exactly those words once. Program words never go. A slow or failed programs search counts as "a program might match": nothing is sent (`searchPlacesChecked` tells failure from "none"). The drawer keeps D-552's rule, which also asks when Pam's list of areas has nothing; that is the clause in `privacy.s.sharing.p7` ("a place Pam's own list of areas doesn't have"), still true for the drawer and for the explicit tap. See `wantsGoogleFromBox` and its tests.

**Why.** Google Maps does not make a person say whether they are typing a service or a place. Browsing by area stays for people who do not know what to type.

**Replaces.** The launcher's typeahead pill and the programs search on the Explore list (typing no longer filters the list behind it).

**What a later session might reverse.** Chips not shown on the open screen; Areas-first for digits; three searches in parallel as you type.
