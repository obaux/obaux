# D-562 — Help opens in a dialog; dark link text is off-white lime

**Date:** 2026-10-13 · **Branch:** `claude/pam-design-help-callout`

Will (13 October, via Mira): the help form leaves the page and a call-out opens it, and it must be readable ("Right now it's hard to read. Text is small"); in dark mode the lime link text in the help desk lists "gets overwhelming"; the icons may stay lime, the text "closer to a very light lime / off white". Wren builds both.

## 1. The call-out and its dialog

**A modal dialog, full screen on a phone** (not a page of its own). The reader keeps their place in the post; the form is two fields; a native `<dialog>` + `showModal()` gives focus inside the form, Esc, a backdrop, and focus back on the button (the backdrop dims the page; clicking it does not close the dialog, see Behaviour). A page would need a route, a Back and the post's scroll to be put back.

- **Call-out** (replaces the form in the "Still stuck?" card): the card as now (`surface-muted`, radius 24, hairline; 24px inside on a phone, 32 from 900px), `heading_title24` "Still stuck?", one line in `lead_17` in `text-secondary`, and the one action: a primary pill, min-height 54, `label_strong17`, brand fill, full width on a phone, "Write to us" (Sage signs the line and the label). With the form off, the address as now, no button.
- **Dialog, phone (under 900px):** 100% wide, `100dvh` tall, no radius, 24px padding all round (the top clear of the notch: `env(safe-area-inset-top)`), the content scrolls inside it. **From 900px:** centred, 560 wide, at most `100dvh − 64px`, radius 24, 32px padding, hairline `border-subtle`, `surface-page`; backdrop black at 50% (60% in dark).
- **Head:** a row, min-height 56: the title in `heading_title24` ("Still stuck?") at the start, a Close button at the end (48 × 48, ghost, a 24px X, `aria-label` "Close"). `aria-labelledby` the title. 24px under the head.
- **Intro:** `lead_large17` (17/25.5), `text-secondary`, 16px under the head, 24px above the first field.
- **Fields (one column, 320 and 390):** the label above, `label_strong17` (17/24, 600), `text-primary`, 8px above the field. Field text **17px** (`lead_17`), the box **56px** tall (the app's field height), radius 12, 1.5px `border-strong`, 16px side padding, page fill. The message is a textarea, min-height 160, padding 14 × 16, vertical resize only. **24px between fields.** Focus: a 2px ring in `brand-primary` with a 2px offset (lime in dark; 3:1 or more on the page in both).
- **Errors:** under the field, 8px, `lead_17`, with the words Sage has signed; the colour from the theme's error text token (AA on the page in both themes); the field's border takes the same colour. Never colour alone: the line is words.
- **Send:** a primary pill, min-height 54, `label_strong17`, full width, 32px below the last field. While sending, the label stays and the button is disabled (as now).
- **Sent / failed:** in the same dialog: `heading_title24` "Sent. Thank you.", `lead_large17` "A person at Pam will read it and write back.", and a 48px soft "Close". Failed keeps the form and its text, and says so above Send.
- **Behaviour:** `autofocus` on the message; Close or Esc closes it (not while sending). Clicking outside it, on the backdrop, does not: Astryx's `purpose="form"` ignores the backdrop on purpose, so a stray click never loses what someone has typed. Will's card a83 said tapping outside closes it; the merge desk decided on 13 October (Iris, help form walk-through, P1) to keep what it does and correct this record; the page behind does not scroll (`overflow: hidden` on `body` while it is open: iOS ignores the dialog's own lock); the dialog fades in over 160ms on (0.2, 0, 0, 1) with `prefers-reduced-motion: no-preference`, instantly otherwise; focus returns to "Write to us".
- All type styles used exist in `website-type.stylex.ts`. New English words (the call-out line, the button, the intro, the Close label) go to Sage (A29).

## 2. Dark-mode link text

**`--website-text-link`**: `light-dark(#0F5847, #EEF1C2)` (added to `website.stylex.ts`, `website-palette.ts`, and tested in `website-tokens.test.ts`). Light is the brand green it was; dark is a very light lime, off-white with a hint of green.

Contrast, dark: **14.76:1 on the page** (#1B1B1B), 12.97 on `surface-muted`, 11.31 on `surface-gray`, **10.39 on the row hover** (`surface-brand-soft`, which is lime at 14% over the page). The old lime text was 12.23 on the page; this is a quieter colour, not a weaker one. Light: #0F5847 is 8.9:1 on white and over 7 on the soft hover.

**Not colour alone** (the new link colour is only 1.17:1 from white text, so colour does not tell a link from its neighbours): in a list of rows (`PostRow`) the paper icon and the chevron stay lime (`brand-primary`), the row is a 48px target with a hairline, the title is `label_14` weight 500, and **on hover and keyboard focus the title is underlined** (1.5px, offset 4px) over the soft lime fill. Links in running text (the "More: …" links, the address) are **always underlined**, as they are now. The breadcrumb link ("Support", above a post's title) is **always underlined** too, since it sits among plain text.

**Where else the token applies** (every text link now drawn in the theme's lime accent): `PostRow` titles (Support index, topics, search results); the "More: …" link at the end of a post's section; the breadcrumb "Support"; the header's "Get help"; the "On this page" menu's links; the address link in `HelpAddress` and any `TextLink`/`LegalLink` quiet link. **Not**: icons, chevrons, the lime Sign in button, the hero's lime words (display type, decorative), the footer links (white on the deep green).

Pictures (390px, dark, the real built pages with the colours applied in the browser): `docs/design/review/2026-10-13-help-desk/`.

## Correction, 13 October

The sentence above first said "Esc and the backdrop close it". The built dialog closes with Close or Esc only; clicking outside does not close it, so nothing typed is lost to a stray click. Kept on purpose (merge desk, relaying Iris's P1). Docs only; no code or story changed.
