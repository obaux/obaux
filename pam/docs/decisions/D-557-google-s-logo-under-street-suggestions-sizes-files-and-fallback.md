# D-557 — Google's logo under street suggestions: sizes, files and fallback

**Date:** 2026-10-13 · **Branch:** `claude/pam-design-google-logo` (off Piper's `claude/places-programs-street-search`, D-552)

Google's "Policies and attributions for Places API": with no Google map on screen, a search field showing Google's suggestions must show Google's logo inline. Text alone does not meet it. (Read by Mira from search results on 13 October; Will is checking the page itself. Dot cannot reach developers.google.com.)

- **The logo:** Google's "Google Maps" attribution, unaltered, from Google's own downloads: nothing drawn or recoloured here. Will downloads them (card a81); Mira passes them on as they are. They go in `apps/web/public/google/`, one for light backgrounds and one for dark, served by Pam, never loaded from Google (Privacy p5). The plain version, not the outlined one: the drawer's surface is flat.
- **Size:** 18px high, width from the file. Google's range is 16 to 19; 18 keeps zoom and rounding inside it. Clear space 10 left, right and top, 5 below, as padding on the row. **Centred** in the row (Will, 13 October, p7 signed), under the Google rows, with the sheet's footer line ("Pam remembers the area you pick on this phone only.") centred under it: the same centre, checked at 320 and 390 (both at the same x). The footer line is `Text` 14px with `text-align: center`; the sheet's column gap stays between them.
- **Light or dark:** by `prefers-color-scheme` through `<picture>`, the way the Pam wordmark does it.
- **Name:** `alt="Google Maps"` and `translate="no"`, not "Powered by Google" (Google's accessible-name rule; Sage informed). A brand name, never translated.
- **Fallback:** if the file does not load, the words "Google Maps": no wrapping, `translate="no"`, `lang="en"`. Google allows text only where the logo cannot fit; this is for a failed load, so the attribution is never missing. The files will be added to the imagery list and a test asserts they exist and are served locally.

**Done when:** the files are in `public/google/`, the README says where they came from and when, and a look at 320 and 390 in light and dark shows the logo at 18px with its space.

## Google's files are in (14 October)

Will approved card a81 on 14 October (04:05) with Google's own attribution set, which the merge desk passed on (`mira/google-maps-attribution-assets`). Two files are used, unchanged and renamed for Pam: Gray (#5E5E5E) for light backgrounds and White for dark, Google's rule being the version that contrasts with what is behind it. The drawer's surface is flat, so the outlined sets (for a map or photo) are not used. Served from `apps/web/public/google/`; the README there records where they came from. A test checks they exist, are the 98 × 18 files with nothing that runs or loads, and are not fetched from Google; the street-search e2e checks the logo loads from Pam's own origin at 18px. Pictures at 320 and 390, light and dark: `docs/design/review/2026-10-14-google-logo/`.

**Still not confirmed by Will:** that 16 to 19px and the sentence "Google Maps" match Google's page. Check before launch (also said in the public/google README).
