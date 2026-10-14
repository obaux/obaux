# Search bars: the dark pill is back, and one height token (D-574), 390px

Rows: 1 the resting bar on Explore, 2 the bar while active (Cancel beside it), 3 the Location sheet's search box. Across: light before, light after, dark before, dark after (`before-after-all-390.png`); singles beside it. "Before" is `main` with D-569.

- **The outline:** while a search field is active the whole pill is outlined again, 3px ink (white in dark mode), in every search bar (the shared `SearchPill` / `SearchField`, one rule on the large input group). Every other text box still draws none (D-569).
- **One height:** the resting launcher and every open search field read `--pam-search-height` (60px), one token in `tokens.stylex.ts` and `styles/tokens.css`. They were both 60px already (measured: launcher 60, open pill 60, the sheet's box 60), so nothing moves; the token stops them drifting. The picture shows what still makes them feel apart: the resting bar is full width with its words centred, the active one is narrower (Cancel sits beside it) with its words at the left. That is a choice for Will, not a height.
