# Search bars: the dark pill is back, and one height token (D-574), 390px

Rows: 1 the resting bar on Explore, 2 the bar while active (Cancel beside it), 3 the Location sheet's search box. Across: light before, light after, dark before, dark after (`before-after-all-390.png`); singles beside it. "Before" is `main` with D-569.

- **The outline:** while a search field is active the whole pill is outlined again, 3px ink (white in dark mode), in every search bar (the shared `SearchPill` / `SearchField`, one rule on the large input group). Every other text box still draws none (D-569).
- **One height:** the resting launcher and every open search field read `--pam-search-height` (60px), one token in `tokens.stylex.ts` and `styles/tokens.css`. They were both 60px already (measured: launcher 60, open pill 60, the sheet's box 60), so nothing moves; the token stops them drifting. The picture shows what still makes them feel apart: the resting bar is full width with its words centred, the active one is narrower (Cancel sits beside it) with its words at the left. That is a choice for Will, not a height.

## Take two (Will, 05:55, via the merge desk 06:16): one bar, words in place
`take1-vs-take2-390.png`: rows 1 resting, 2 the moment after the tap (outlined, Cancel in), 3 the Location drawer; across: light take one, light take two, dark take one, dark take two. Singles: `take1-…` and `take2-…`. ("before" in the first section is `main`.)
- **Words in place:** the resting bar now has the magnifier and "Search programs" at the left, with the open field's own left room, gap and type (16px, 600), so a tap changes nothing under the eye but the outline and the room for Cancel.
- **The right edge draws in:** Cancel comes in over 200ms (its width and opacity), so the pill's right edge moves to make room; none under reduced motion (the pictures are taken with it on, so they show the end state).
- **Room before Cancel:** 12px (a spacing token) between the pill and Cancel, plus the 5px of outline: about 15px clear (it was about 3).
- **The drawer's box is unchanged.**
