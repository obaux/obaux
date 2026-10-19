# D-619 — D-619 A status Notice is the toast, in the one stack with the failure banner

**Date:** 2026-10-19 · **Branch:** `claude/pam-design-warning-toast`

Will, 19 October, 00:26 (answering a105): *"I want to stop using this style. Please use the toast banner instead."* The merge desk read "this style" as the status card (`Notice`) and "the toast banner" as Astryx's `Toast`; no toast was in use before.

## Decided

1. **A status `Notice` is the toast.** Every `NOTICES` kind that is not `empty` (error, warning, info) is drawn as a toast at the bottom of the screen: Astryx's toast look (the inverted surface for a calm state, the error surface for a fault), drawn in `NoticeToast.tsx` and not by Astryx's `Toast` component. Not changed: `EmptyState` (nothing here yet) and `CompactNotice` (the one-line alert by a field); Will may ask for those later. The screen still says `<Notice notice=…/>`; the card's words, Contact Pam (A28, `ContactHrefContext`), retry, `userFacingNote` (replaces the body; the internal reason never reaches it), `quiet` (D-432: Contact Pam as a link) and its alert or status role are kept.
2. **One stack with the failure banner (D-618).** The toasts sit above, the banner at the bottom edge, in one flex column inside the host that is above the tab bar, the keyboard and the safe area, so nothing in it can cover anything else in it, or the tab bar. Astryx's own `ToastViewport` is not used: it is a popover in the top layer, so it would sit over the banner, the tab bar and the sheets. Nor is its `Toast` component: it added 4.5 kB gz to the first load (found by taking it out, then `MediaTheme`, which it and the card's text colouring use, as the part that leaks), with the first-load budget at 0 spare. The card is drawn here with the same surface tokens; the calm card's words take the page's own background colour (the inverse of its ground) instead of `MediaTheme`'s measuring.
3. **A state that lasts has no close and cannot be swiped away** (offline, a paused account, a page that cannot load, an invite that cannot be used). It goes when the state ends, because the `Notice` unmounts. There is no swipe at all (Astryx's is always on and cannot be turned off for a state that lasts); a one-off is closed with its close button. A one-off says `closable` and gets a close. This is the reason `Notice`'s own comment gave: a member must not be able to swipe away why their account is paused.
4. **Error is the red card; warning and info are the dark card.** Toast has two types. An error (a failed page, a paused account) is the red card. A warning (offline, an account with some things turned off) is a calm state and not a fault, so it is the dark card, with its own `role="alert"` as the card had; information is `role="status"`.
5. **The card is the fallback.** The stack loads with the page idle, so it is not in the root bundle and is there when the network is not. Until it has loaded, or if it cannot, `Notice` draws its card as before: a state is never left unsaid. With no sink at all (packages/ui tests, the Notice stories) the card is drawn.
6. **The page underneath is never blank (§0).** Every screen that had a card as its only content also has its header or Back bar, which is what shows behind the toast.

## Not changed here

- The 16 failed actions that are being converted onto `useMalfunction` (D-616/D-618) stop being cards when their owners convert them; until then they are toasts with no close (a failed action stays until the person acts, as the card did).
- The three that name a reason the person can fix (`SignInScreen`, `PoliciesView` ×2) are left to the owners, as D-616 keeps those inline.
- The card-stripe colours (D-509 note): the card is no longer drawn in the app, so the question goes with it; the compact row's fix stays.

## What a later session might reverse

Warning as the dark card (a warning could be the red card, as Astryx's own two types suggest); the page-wide stack cap; `closable` defaulting to false.
