# Staff "All programs": where the one search bar goes (card a86), 390px, light and dark

Pictures of the real screen (case manager signed in, `/programs/`), example programs. `1-today-…` is today: a round search icon between Back and the + / Help buttons. `2-proposed-…` puts Piper's one-line bar on the page. `today-vs-proposed-light-dark-390.png` has all four (across: light today, light proposed, dark today, dark proposed).

**Placement.** Back stays at the left and + and Help at the right, on their own row, as today. The bar goes **on a row of its own under them**, full width, above the category chips: the same bar, the same height and the same place relative to the chips as Explore's one-line bar for members. The round search icon goes (the bar replaces it). The heading "All programs" and its "Near City Hall ✎" control are unchanged.

**Why not in the top row.** I tried it between Back and + / Help first: the bar shrinks to about 200px and its words are cut ("Search progra…"), and "Search programs or places" is the one line Will asked for.

**Open state.** Tapping the bar opens the same screen as on Explore (cursor in the box, the programs / areas / addresses list); Cancel returns here. Nothing about that screen is staff-specific. The bar hides on scroll down and returns on scroll up, as Explore's does (`useHideOnScroll`).

**For the build (Piper).** `proposal.patch` is the throwaway edit I used to draw it, not meant to be applied as is: `ExploreView` gets an optional `searchBelow` slot rendered between the top row and the chips, `ExploreScreen` fills it in programs mode while not searching and drops the round `IconButton`. The words on the bar are a stand-in; Piper and Sage have the real ones.
