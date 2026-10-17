# D-601 — One drawer for the whole app: PamSheet

**Date:** 2026-10-17 · **Branch:** `claude/pam-design-drawer-standard`

**Decided by Will, 17 October 2026, card a93:** "We need a way to standardize these drawers across the entire app so they all have enough space on that top notch for the person to tap and it closes. They should also have a green link on the top right that says 'Done'... We have a couple variants of it: one says 'Close' on the top right and another one says 'Done', depending on the purpose of the drawer. I do think we need more space from the title to the top edge." Built by the design lane; pictures wait for Will before it ships.

## What

`@pam/ui/PamSheet` (on Astryx `BottomSheet`), the one drawer. In order: a 48px band across the top that closes it on a tap (above Astryx's 24px decorative strip, which still draws the grip and still drags); the title starting 56px from the top edge; one green link at the end of the title's row (`--color-text-accent`, 17px/700, 48px target); then the content. Swipe and Escape still close it. Focus goes back to whatever had it when the drawer opened.

The word, by `kind`: **`read` → "Close"** (`trips.confirm.close`): a drawer you look at, or whose rows take you somewhere else. **`pick` → "Done"** (`action.done`; the area drawer keeps `places.area.done`, the same word): a drawer where you choose or set something and then leave it. The caller passes the word, so it follows the language.

## Why it is built this way

- **The band is a touch target, not a second way to close.** For a screen reader or a keyboard it is `aria-hidden` and `tabindex=-1`: the link is the one named control, and it is the first thing after the title. Mira's brief asked for the band to be "labelled for screen readers"; two controls that say Close in a row would read worse. Reverse this by giving the band the same `aria-label` and removing `aria-hidden`.
- **One visible way to close**, plus swipe and Escape. The X buttons (Bring a friend, the signature sheet) and the area drawer's "Cancel" are gone.
- **Focus return is explicit** (`finalFocusRef`, read from the element that had focus when it opened): Astryx's own return fell to the page when the opener had been redrawn, which it was on the area drawer (checked: the active element was `body`).
- **Bring a friend**: the banner now sits under a Close row instead of at the very top, because a green link over a photo does not read. This is the one drawer that looks different, and the one to look at.
- **The signature sheet says Close, not Done**: leaving it signs nothing, and Done would say it had.
- **Titles are all 26px/700.** Open in… (the map apps) had a 15px quiet label (Will, 10 October: "much smaller"); it now follows the standard.
- **The area drawer says Done**, where Will's 14 October call (a81) had Cancel. Either word is one prop; it is Done here because the standard's second variant is for drawers where you pick, and because Mira's list gave it. Tell Will it changed.

## Not done

`MapDrawer` (the docked trips drawer) is not a `BottomSheet` and is not a drawer in this sense; it keeps its own handle. Ava's "What you can see" sheet (a93, on her branch) moves onto `PamSheet` once this is on `main`.

