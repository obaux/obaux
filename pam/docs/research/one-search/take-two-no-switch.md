# One search, take two: no switch (Will, 14 October 2026, 04:39)

Will: "If I'm in Google Maps I can type either a program name or an address and it will just show me the list. I don't have to select whether it's a service or an area. Why do we need to make a distinction? Also I don't like the subtitle under 'Search program' inside the search bar. It feels too crowded. Can we just streamline this and merge everything into one?"

**Pictures only; nothing is built.** 390 wide, light and dark, drawn from the real components on a throwaway page that is not committed (`v2-*.png` here; take one's `v1-*` stay for comparison). No ring on the text box. Words are stand-ins for Sage. Google's logo now shows because Dot's files are in.

| | Light | Dark |
|---|---|---|
| 1. Explore: one bar, one line; the area sits on the list ("All programs … Near City Hall") | `v2-1-explore-one-line-bar-light.png` | `…-dark.png` |
| 2. Open, before typing: cursor in the box, "Use my current location" on top | `v2-2-open-before-typing-light.png` | `…-dark.png` |
| 3. Typing "food": programs first, no Google rows, an explicit "Search addresses for “food”" row | `v2-3-typing-food-light.png` | `…-dark.png` |
| 4. Typing "1500 Market": an area, then Google's addresses with the Google Maps mark | `v2-4-typing-an-address-light.png` | `…-dark.png` |
| 5. Back on Explore after picking an area or an address ("Near 19102") | `v2-5-explore-after-picking-light.png` | `…-dark.png` |

Picking a program opens its page. Picking an area or an address returns to Explore with the list measured from there. Chips stay on Explore under the bar. There is no switch and no area control; to change where the list is measured from, type the place in the bar.

## The privacy rule, and what the code does today

The signed line (`privacy.s.sharing.p7`): "When you type a street address, a corner, or a place Pam's own list of areas doesn't have, Pam's server sends the words you typed to Google…".

Today's test is `wantsGoogle` in `lib/streetSearch.ts`: three or more characters, not only digits, **and** (the text starts with a house number and a word, **or** it has "and", "at", "&" or "/" in it, **or Pam's own list of areas found nothing**). The last clause is the "place Pam's own list doesn't have" in the signed line.

**That last clause would be broader than the new design, and cannot stay.** With one box, "food" matches programs but no area, so today's rule would send "food" to Google. The new rule drops it: **Pam asks Google only when the text looks like an address, or when the person taps "Search addresses".** That is narrower than the signed line, so nothing the line promises is broken: it says what Pam *may* send, and the new rule sends less. Two consequences:
- The signed clause "a place Pam's own list of areas doesn't have" is now only true for the explicit tap (a person typing "Liberty Bell" and tapping "Search addresses for…"). It stays accurate there; Lena may want to tighten it later so it does not suggest Google is asked for every unknown word.
- The new explicit row needs a sentence ("Pam sends these words to Google when you tap", stand-in) that Sage signs. It tells the person before anything is sent.

### The address test, and how it fails safe

Send to Google automatically only when **all** of these hold:
1. three or more characters, not only digits (a ZIP never goes);
2. the text looks like an address: it starts with a house number and a word ("1500 Market"), **or** it is a corner ("Broad and Girard", "Broad & Girard", "Broad / Girard");
3. **no program matches the text.** The programs search must have answered (settled) with nothing.

Rule 3 is the new guard. It stops a program called "12 Steps Recovery" or "Arts and Crafts Center" from looking like an address and being sent. It fails safe in each direction:
- **Programs search slow or failed:** unknown counts as "a program might match", so nothing is sent. The explicit row is still there.
- **A real address that happens to match a program** ("1500 Market" when a program is at 1500 Market St): no automatic Google rows; the person sees the program, and "Search addresses for “1500 Market”" below it.
- **A real address the test does not recognise** (a place name, "Liberty Bell"): nothing sent until the person taps the explicit row.
- **No key / status unreadable:** as today, nothing about what was typed is sent, and the explicit row is hidden.
- **Program words** can never go to Google by accident: they match a program (rule 3) or fail rule 2. The only way they go is a tap on a row that says so.

I would also keep today's guards: the 400 ms pause, one Google session from first letter to pick, and "Used for this search only." on the rows.

## What changes, compared with the app today

- **Removes:** the "Search programs" launcher and the separate area control (the "Near 19102 ✎" link and the Location **drawer**, `AreaSearch` in `app/places/AreaPicker.tsx`), and take one's Programs | Area switch (never built). `AreaTrigger`/`AreaChip` leave Explore. The area is plain text on the list.
- **Moves:** `useAreaSearch` (Pam's areas), `usePlaces`' name search (programs) and `useStreetSearch` (Google) all feed **one** list in three sections, programs, areas, addresses; "Use my current location" is the empty state. The Google mark and "Used for this search only." move with the address rows.
- **One decision to make:** typed digits (a ZIP like 19104) also match programs' addresses, so "programs first" would bury the area the person typed. Suggest: all-digits goes **Areas first**.
- **Three searches in parallel** as you type (programs, areas, and Google only by the rule above): more work on a slow phone; the programs and areas calls are what today's two searches already do, so nothing new reaches the database or Google.

## What it would touch or break

- **e2e:** `area-picker`, `street-search`, `explore-bell`, `explore-bell-shift`, `places.spec` (they open "Change the area" or "Search programs"), `focus-text-boxes`; the street-search privacy specs (nothing sent for program words, status unreadable) are kept and gain the new cases from the address test above. The checks stay; the steps change.
- **Case manager's All programs:** its round search icon opens the same screen; the "Near …" text sits on its list too. Dot places it among back, add, and Help.
- **Storybook and pictures:** `Explore`, `AreaChip`, `StreetSearch` stories, prototype routes, the gallery page, and the `docs/street-search` pictures are re-shot.
- **Copy for Sage and Lena:** the bar ("Search programs or places"), the box's hint, the three section names, the explicit row. `places.near` stays. Retired strings stay in the bundles until a clean-up.
- **Screen readers:** one button, "Search programs or places"; the open screen's sections are lists with headings; changes announced in the live region, as the drawer does now.
- **No database change, nothing different sent to `services_search`/`services_near`**; `places-search` is called less often than today.

## Questions for Will and Dot

1. All-digits typed: Areas first (suggested), or programs first?
2. Should the "Near …" text on the list be tappable, as a shortcut into search with the area words selected? Drawn as plain text.
3. Staff's All programs: same bar and screen; where does it sit?
