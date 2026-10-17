# D-601 — One drawer for the whole app: PamSheet

**Date:** 2026-10-17 · **Branch:** `claude/pam-design-drawer-standard`

**Decided by Will, 17 October 2026, cards a93 and a97.** a93: "standardize these drawers across the entire app so they all have enough space on that top notch for the person to tap and it closes … a green link on the top right … 'Close' … 'Done' … more space from the title to the top edge." a97 (16:37, after seeing pictures): "let's keep the original drawer with image touching edge and x button. Bring the X circle button to the others where it says close (position neatly on top right corner), and the same for done, create rule that when drawer requires action inputs in main area, use checkmark icon, if only informative, use checkmark icon. But if action is performed inside drawer (like the copy link example) then use X icon. Keep the headers consistent with the extra space above like you mocked up, but the icon button should be in top right corner." This replaces a93's green text link.

## What

`@pam/ui/PamSheet` (on Astryx `BottomSheet`), the one drawer. In order: a 48px band across the top that closes it on a tap (above Astryx's 24px decorative strip, which still draws the grip and still drags); the title starting 56px from the top edge; one round button tucked into the top-right corner (top-left in Arabic): a 36px circle 16px in from the top and the side, so it sits inside the sheet's rounded corner, with a 48px tap target (an invisible 6px margin). Muted grey on a sheet; over Bring a friend's picture it is the white circle with a soft shadow it always had (Will, 17 October, after seeing the first version: "not neatly tucked away in that corner"); then the content. Swipe and Escape still close it. Focus goes back to whatever had it when the drawer opened.

**The icon is a rule about what the drawer is for** (`kind`, written in PamSheet's comment too):
- **`review` → a checkmark, named "Done"** (`action.done`; the area drawer keeps `places.area.done`, the same word). You pick in the drawer, or you only read it: Location, Opening hours, Open in…, New message, What you can see.
- **`act` → an X, named "Close"** (`trips.confirm.close`). Something is done inside the drawer itself, so a checkmark would say it had been confirmed: Bring a friend (the link is copied there), Sign a policy (the signing happens there).

## Why it is built this way

- **The band is a touch target, not a second way to close.** For a screen reader or a keyboard it is `aria-hidden` and `tabindex=-1`: the round button is the one named control, and it is the first thing after the title, so a screen reader hears it once. Reverse by giving the band the same `aria-label` and removing `aria-hidden`.
- **Bring a friend is the original again**: the picture at the very top edge, the round X over it. Its banner, grip and top-edge rules are D-338; PamSheet draws the X and the notch, `title={null}` removes the title row. Its link field reads left to right (`dir="ltr"`), so an Arabic reader sees it from `https://`.
- **Focus return is explicit** (`finalFocusRef`, read from the element that had focus when it opened): Astryx's own return fell to the page when the opener had been redrawn, which it was on the area drawer (checked: the active element was `body`).
- **Titles are all 26px/700.** Open in… (the map apps) had a 15px quiet label (Will, 10 October); it now follows the standard.
- **No new words.** Done and Close are existing keys in seven languages.

## Not done

`MapDrawer` (the docked trips drawer) is not a `BottomSheet` and keeps its own handle. Ava's "What you can see" sheet (a93, on her branch) moves onto `PamSheet` (kind `review`) in whichever ships second.
