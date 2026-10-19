# D-619 — D-619 A status Notice is the toast, in the one stack with the failure banner

**Date:** 2026-10-19 · **Branch:** `claude/pam-design-warning-toast`

Will, 19 October, 00:26 (answering a105): *"I want to stop using this style. Please use the toast banner instead."* The merge desk read "this style" as the status card (`Notice`) and "the toast banner" as Astryx's `Toast`; no toast was in use before.

## Decided

1. **A status `Notice` is the toast.** Every `NOTICES` kind that is not `empty` (error, warning, info) is drawn as Astryx's `Toast` card at the bottom of the screen. Not changed: `EmptyState` (nothing here yet) and `CompactNotice` (the one-line alert by a field); Will may ask for those later. The screen still says `<Notice notice=…/>`; the card's words, Contact Pam (A28, `ContactHrefContext`), retry, `userFacingNote` (replaces the body; the internal reason never reaches it), `quiet` (D-432: Contact Pam as a link) and its alert or status role are kept.
2. **One stack with the failure banner (D-618).** The toasts sit above, the banner at the bottom edge, in one flex column inside the host that is above the tab bar, the keyboard and the safe area, so nothing in it can cover anything else in it, or the tab bar. Astryx's own `ToastViewport` is not used: it is a popover in the top layer, so it would sit over the banner, the tab bar and the sheets.
3. **A state that lasts has no close and cannot be swiped away** (offline, a paused account, a page that cannot load, an invite that cannot be used). It goes when the state ends, because the `Notice` unmounts. Astryx's swipe is always on and has no prop to turn it off, so the touch that would start it is stopped before it reaches a lasting card. A one-off says `closable` and gets a close. This is the reason `Notice`'s own comment gave: a member must not be able to swipe away why their account is paused.
4. **Error is the red card; warning and info are the dark card.** Toast has two types. An error (a failed page, a paused account) is the red card. A warning (offline, an account with some things turned off) is a calm state and not a fault, so it is the dark card, with its own `role="alert"` as the card had; information is `role="status"`.
5. **The card is the fallback.** The stack loads with the page idle, so it is not in the root bundle and is there when the network is not. Until it has loaded, or if it cannot, `Notice` draws its card as before: a state is never left unsaid. With no sink at all (packages/ui tests, the Notice stories) the card is drawn.
6. **The page underneath is never blank (§0).** Every screen that had a card as its only content also has its header or Back bar, which is what shows behind the toast.

## Not changed here

- The 16 failed actions that are being converted onto `useMalfunction` (D-616/D-618) stop being cards when their owners convert them; until then they are toasts with no close (a failed action stays until the person acts, as the card did).
- The three that name a reason the person can fix (`SignInScreen`, `PoliciesView` ×2) are left to the owners, as D-616 keeps those inline.
- The card-stripe colours (D-509 note): the card is no longer drawn in the app, so the question goes with it; the compact row's fix stays.

## What a later session might reverse

Warning as the dark card (a warning could be the red card, as Astryx's own two types suggest); the page-wide stack cap; `closable` defaulting to false.
