# D-621 — D-621 Every alert is Astryx's Banner in red, and the gate screens use the new header

**Date:** 2026-10-19 · **Branch:** `claude/pam-design-b78`

Will, 19 October, 03:47 (Control Room), on the paused screen beside the visit page's blue banner: *"This page is using the old header, so prob not something we support anylonger. Can you make sure? Also this alert banner doesn't look like the ones we use here in blue. The blue variant (but in red) is the style of alert banner I want to use across the entire app."*

## Decided

1. **Every alert is Astryx's `Banner`, `status="error"`.** The failure banner (D-618, every kind including the second failure) and the status notices in the bottom stack (D-619: offline, paused, won't load, invite expired, limited account) are drawn by one component, `StackBanner` (`apps/web/src/lib/StackBanner.tsx`), which is `Banner` itself and not a redraw: the tinted ground, the icon and title in the status colour, the line, the actions at the end (Try again, Sign in, Show the latest, Get help, Contact Pam; quiet Contact Pam is a link), and a close only for a one-off. It is the same component as `place/page.tsx`'s blue `status="info"` banner, in red.
2. **It supersedes** D-619's point 4 (red for a fault, calm for the rest) and the calm-surface note of D-618 (Mira, 02:36): Will wants red for all of them. D-619's "drawn from Astryx's primitives and tokens" becomes "Astryx's `Banner` itself". The solid red card, the dark inverse card and the plain-markup drawing of them are gone.
3. **Opaque over content.** `Banner`'s tint alone is see-through, so it sits on an opaque backing of the page's own colour with the radius and shadow of a floating card. Checked over a busy screen in light and dark.
4. **Role.** `Banner` gives `role="alert"` for error, so the calm states (offline, limited account) are announced at once too. That is accepted: it is what the one component does, and the announcement is once.
5. **Kept** from D-618 and D-619: the bottom position and the one stack (the banners above, the failure banner at the edge, above the tab bar, the keyboard and the safe area); a state that lasts has no close and no swipe; a one-off is closable; the words per kind; the buttons; the lazy 'done'; the stand-in while the stack loads (it now draws Banner's red in plain markup: the error tint over the page's colour, in the red text colour).
6. **Not changed.** The blue `status="info"` banners that are notes and not alerts stay blue (place.noLead, place.lead.sees, the 11 others). The `status="warning"` banners stay as they are: `ProgramWizard.tsx:178` (a name is needed), `ProgramReviewView.tsx:159` (changes to review), `ProfileView.tsx:160` (a photo notice); the site app's two (`PostScreen`, `RulesScreen`) are a different app.
7. **Weight.** `Banner` is loaded with the rest of the stack once the page is idle, so it is not in the root bundle; budget with it: see the session log.

## The old header

The paused, no-profile and could-not-load screens of `TabGate` (every tab) and the not-signed-in, error, no-profile and paused states of `account/page.tsx` drew the old page: `AppHeader` and the Help block (`HelpBar variant="block"`). They now use the new layout's bar, as `TabGate`'s loading state does since D-492: the large title bar with the round Help (`LargeTitleHeader` with `HeaderActions` in `TabGate`; `SubPage` with the round back and `HelpButton` on `/account/`), and no Help block. Sign out stays reachable on the paused screen (it is in `NotIn`, and on `/account/`).

Swept: no screen in `apps/web` still draws `AppHeader` or the Help block but the gallery (dev only) and `SignInScreen`, whose `AppHeader` is the current sign-in bar (D-502: a compact mark bar pinned under the invite line on the first step, with the language switcher; it is that screen's own design, not the old page).

## What a later session might reverse

Calm states announced as alerts; the opaque backing (if Astryx gives `Banner` an opaque variant).

## The look, brought closer to the blue banner (Will, 19 October 04:51)

"This alert looks blown up. Nothing like the blue one in the reference image. Please make sure text is small for alerts, X buttons sit neatly on right corner. And action buttons are symmetrical and not overly loud."

- **Text is Banner's own size** (title 14px, line 12px), as the blue `Banner status="info"` on the place page. This **overrides A23/D-432's 16px reading size for alerts**, by Will's word. The 16px overrides in `StackBanner` are gone.
- **The close sits in the top corner** (top-left in Arabic) and never wraps onto the actions row: the actions moved into the description, under the line, so the end area holds only the close.
- **Actions are quiet and symmetrical**: Astryx `Button` ghost at size `sm`, in the banner's red with a thin red edge, not the pale green pill. Two share one width side by side when they fit, and stack one above the other (still equal) when a longer language's labels do not (Russian); one sits alone at its own width. Contact Pam on the paused notice is the same button.
- **48px target: Will's look wins.** The buttons are Astryx's small size (about 32px tall), with 8px between them, which meets WCAG 2.5.8 (24px). The e2e check is now at least 24px.
- **Room for the page**: a spacer at the end of the page as tall as the stack, and the tapped control is scrolled clear on the next frame and again when the page resizes in the first second (Nico's L1 checks at 320x568).
- Pictures: `docs/design/review/2026-10-19-d621-banner/` (light, dark, Arabic, Russian; compare-blue-* shows the red failure under the blue "only to help you plan" banner).
