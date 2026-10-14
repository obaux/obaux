# One search for Explore — pictures (Will, 14 October 2026, 04:23)

Will: "also simplify the user and merge search and filter. When they search it opens a message where they can write, and write in the filter between the two." Read by the merge desk as: the "Search programs" bar and the separate area control become **one bar**; tapping it opens a full screen with the keyboard up and a two-way switch **Programs | Area**; category chips under the switch.

**Pictures only.** Drawn at 390 px wide, light and dark, from the real components (search field, switch, chips, rows, cards) on a throwaway page that is not committed. No ring on the text box (Will, 04:08). Words are stand-ins for Sage. "Google Maps" shows as words because Google's logo files are not in the app yet.

| | Light | Dark |
|---|---|---|
| 1. Explore with the one bar (area under the words) | `v1-1-explore-one-bar-light.png` | `v1-1-explore-one-bar-dark.png` |
| 2. Open on **Programs**, typing | `v1-2-open-programs-typing-light.png` | `v1-2-open-programs-typing-dark.png` |
| 3. Open on **Area**, typing a street (Pam's rows first, Google's under them, the mark, "Used for this search only.") | `v1-3-open-area-typing-a-street-light.png` | `v1-3-open-area-typing-a-street-dark.png` |
| 4. Back on Explore after picking (the bar says "Near 19102"; a street pick shows only its ZIP) | `v1-4-explore-after-picking-light.png` | `v1-4-explore-after-picking-dark.png` |

## What I drew, and why

- **The bar is two lines**, not a wide pill with a second control: "Search programs" and, under it, "Near 19102". Two lines survive a long Spanish or Russian area name and 320 px; a bar with a pin and a ZIP beside the words does not. Tapping anywhere on it opens the search.
- **Open screen:** the text box (cursor already in it) with Cancel beside it, the **Programs | Area** switch, then on Programs the category chips and matching programs as rows (name, address, distance). On **Area** the chips go away (they filter programs, not places to stand) and the rows are today's: Use my current location, Pam's areas, Google's rows, the mark, the line that Pam remembers the area on this phone only.
- The switch remembers the last side. Typing a ZIP while on Programs could offer "Search this area instead", not built here.
- Picking a program opens its page; picking an area returns to Explore with the list re-measured. Nothing saved or sent changes.

## What it removes or moves

- **Removed:** the area link with its pencil beside the "All programs" heading (`AreaTrigger` / `AreaChip` in Explore), and the Location **drawer** (`AreaSearch` in `app/places/AreaPicker.tsx`: its sheet, Done, title). The same rows move into the Area side of the new screen. A pick is held until the person leaves the screen or presses a Done/Back, as the drawer holds it until Done (D-275).
- **Moved:** `useStreetSearch` and `useAreaSearch` stay as they are and feed the Area side; the Google mark and the footer line move with it. The member's Explore launcher and Programs search (`SearchPill`, Cancel) become the Programs side.
- **Gained:** the area is on the bar at rest, so a person sees where the list is measured from without a second control. The heading row is just "All programs".

## What it would break or touch

- **e2e:** `area-picker.spec`, `street-search.spec`, `explore-bell.spec`, `explore-bell-shift.spec` and `places.spec` find "Change the area" and "Search programs" by name; each needs its steps changed (open the bar, switch to Area, type). None of the checks is lost: the same things are proved on the new screen. That is most of the tests in those five files.
- **Case manager's All programs:** it already has a round search icon plus Add and Help up top, no launcher. It needs the same bar (its top row is crowded: back, search, add, Help), or the bar sits under the row. Decide with Dot; the open screen is shared.
- **Storybook:** `Explore.stories`, `AreaChip.stories`, `StreetSearch.stories`, the prototype routes, and the gallery page that shows `AreaChip`. The Google picture shots (`docs/street-search`) would be re-taken.
- **Hide-on-scroll** (D-222) hides the search row and keeps the chips: with a two-line bar the hidden height changes; fine, but measure again.
- **Screen readers:** one button named "Search programs. Near 19102" replaces two controls; the open screen needs the switch announced as a pair and the result lists as live regions, as the drawer's already are.
- **Copy:** a new screen title/labels for the switch ("Programs", "Area") and the bar's second line: Sage signs, Lena translates. "Near 19102" reuses `places.near`.
- **No database, no migration, no change to what `places-search` or `services_near` receive.**

## Open questions for Will and Dot

1. Chips on Programs only (as drawn), or on both sides?
2. Should typing a ZIP or address on Programs jump to Area, or stay put?
3. Full screen (as drawn) or a tall sheet? A sheet keeps Explore in view behind it.
4. On All programs for staff: same bar, and where does it sit among back, add and Help?
