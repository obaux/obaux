# One search, take three: the area control stays (Will, 14 October 2026, 04:40)

Will: "I see why having the near ZIP code filter for locations on the right of all programs (or whatever category) is helpful because they can already filter by things near them. That's helpful if they don't know what to search for so I don't think we need to get rid of this feature."

So take two's box stays, and **today's "Near 19102 ✎" control and its Location drawer stay exactly as they are.** Two ways to set where the list is measured from: type it in the box, or tap the control and browse. Pictures only; nothing is built; `v3-*.png`, 390 wide, light and dark, no ring, stand-in words, drawn from the real components on a throwaway page that is not committed.

| | Light | Dark |
|---|---|---|
| 1. Explore: one-line bar, and "Near City Hall ✎" kept on the right of the heading | `v3-1-explore-area-control-kept-light.png` | `…-dark.png` |
| 2. Open, typing "food": programs first, no Google rows, the explicit "Search addresses for “food”" row | `v3-2-typing-food-light.png` | `…-dark.png` |
| 3. Open, typing "1500 Market": an area, then Google's addresses with the mark | `v3-3-typing-an-address-light.png` | `…-dark.png` |
| 4. Explore after picking: the same control now says "Near 19102" | `v3-4-explore-after-picking-light.png` | `…-dark.png` |

Picking a program opens its page. Picking an area or an address returns to Explore and updates that same control (and the remembered area, as the drawer does). The empty open screen is take two's picture 2 (`v2-2-open-before-typing-*`): "Use my current location" at the top. The drawer is not redrawn: it is unchanged.

## Privacy: the signed line stays true as written

- **The drawer** keeps today's rule, including "Pam's own list of areas found nothing", because the drawer searches areas only. That is the clause in `privacy.s.sharing.p7`, and it is true there.
- **The box** uses the narrower rule from take two: Google only for address-like text with no program matching (the programs search must have settled with nothing), or on the explicit tap. Program words never go. How it fails safe is in `take-two-no-switch.md`.
- So p7 still describes what Pam may send, and the box sends less than it. Nothing in Privacy needs to change for take three. The explicit row's one sentence still needs Sage.

## What it removes or touches now (smaller than take two)

- **Removes:** only the launcher ("Search programs") and Explore's Programs search pill, replaced by the one bar. **The drawer, `AreaTrigger`/`AreaChip` and `useAreaSearch`/`useStreetSearch` in the drawer stay.**
- **Adds:** the box's own list (programs, areas, addresses) and the rule above. `useStreetSearch` is used from two places, with a different "when to ask" in each (a parameter, tested).
- **e2e:** `area-picker.spec` and the drawer's `street-search.spec` cases keep working unchanged (the control and drawer are the same); `explore-bell`, `explore-bell-shift`, `places.spec`, `focus-text-boxes` change where they open "Search programs" (the bar's name changes to "Search programs or places"); new cases for the box: programs first, area pick updates "Near …", the address test and the explicit row (nothing sent for program words, nothing sent when the programs search fails).
- **Case manager's All programs:** its round search icon opens the same screen; its heading already carries the "Near …" control. Dot places the bar.
- **Storybook/pictures:** `Explore` states for the box; the `docs/street-search` pictures stay valid (the drawer is unchanged).
- **Copy:** the bar, the box's hint, the three section names, the explicit row. Sage, then Lena.
- **No database change.**

## Still open

1. A typed ZIP also matches programs' addresses; suggest all-digits shows **Areas first** in the box.
2. A person who picks a street in the box sees only its ZIP in the control, as the drawer does today (street search, D-552). Confirm that is wanted for the box too.
