# Website phone layout — spec from Figma (13 October)

Source: Figma "Pam — Website" (`wizzRwn3cjixue2p6eeZfG`), frame **Home — Phone 390** (`7:3`, 390 × 4689) and component
**Callout card** (`18:517`, phone variants `18:506`, `26:1758`, `26:1854`). "Live" is the site at 390px on `main` (0a36ada1), measured in Chromium.
Colours stay as they are (Will, a75). Page is 4689 tall in Figma and 5032 live.

## Text styles at phone width (Figma name → site style → what to change)

| Where | Figma | Live now | Change |
|---|---|---|---|
| Hero h1 | Display/Hero compact 40/41 w600 −0.64 | 40/41 w600 −0.64 | none |
| Hero lead | Lead/17 17/24 w400, text-secondary | 20/30 | `type.lead_17` (was an own 20/30 at phone) |
| Green card title "Who is Pam for?" | Label/Large 20/32 w500 | 20/32 | none |
| Green card chips | Label/14 14/20 w500 | 20/28 (`label_chip`) | `type.label_14` |
| Green card line | Heading/Card 20/28 w600, max 300 wide | 44/57 (`heading_band`) | `type.heading_card` |
| Row heading | Heading/Section compact 40/41 w500 −1 | 40/41 | none |
| Row body | Lead/Large 17/25.5 w400, text-secondary, max 460 | 17/24 | `type.lead_large17` |
| Row button label | Label/Strong 17 17/24 w600 | 17/24 | none |
| Callout eyebrow | Eyebrow/13 13/20 w600 +0.5 caps | 13/20 | none |
| Callout text | Heading/Small 17 17/24 w700, centred | 20/30 w400 (`lead_large20`) | `type.heading_small17` |
| Callout button | Label/14 14/20 w500 | 17/24 w600 | `type.label_14` |
| Header "Support" | Label/14 14/20 w500, text-secondary | 17/24 w600 ("Get help") | `type.label_14` |
| Header "Sign in" | Label/14 | 14/20 | none |
| Footer links | Lead/17 17/24 w400, white, underlined | 15/21 w500 | `type.lead_17` + underline |
| Footer tagline | Body/14 14/20 | 12/20 caption | `type.body_14` |
| Footer copyright | Caption/12 12/20, 70% opacity | 12/20 | opacity .7 |

All of these styles exist in `website-type.stylex.ts`; **none are missing**.

## Spacing, sizes
- Page: sections stacked with 40 between (hero, green card, rows, callout card). Each section 24 top and bottom; cards sit 12 in from the edge (366 wide at 390).
- Header: 48 tall, 20 left / 8 right, wordmark 26 tall (70.7 wide). Live is 78 min.
- Hero: 74 top (under the header), 24 sides, 24 bottom, 20.3 between heading and lead. **No picture block under the hero** (the Figma carousel frame is hidden); live shows the FlipCarousel there.
- Green card: radius 24 (live 28), picture 229 tall full width, text block 32 top / 20 sides / 48 bottom, 20 between items. Chips: padding 6 × 12, radius 15, border 1.3 `border-green`, 12 between rows and 8 between chips, 12px arrow icon 4 from the label. Line has 12 above it.
- Feature rows (3): card is 366 wide with radius 24, text block padding 24, 20 between heading, body and button; the button is a **full pill**, min-height 54, padding 6 × 18; the grey picture panel under it is 400 tall, radius 24, `surface-muted`. Row 1 also has three small picture-chips under the heading (not the text chips live uses).
- Callout card ("Privacy first" / "Support"): `surface-muted`, radius 24, 24 sides / 32 top and bottom, 32 between the two halves with a 1px rule between (no dashed side line), 18 between eyebrow, text and button; buttons are 36 tall (14/20, soft fill), the section has 48 above and 120 below.
- Footer: `surface-brand-deep`, 417 tall, padding 64 × 24; wordmark 36 tall; 12 gaps; links 40 tall each, stacked and centred; copyright 12 above.

## The green card and its views (`18:517`)
Three views (phone and desktop each; same words and pictures). Each shows the same title and the same three chips; what changes is the **selected chip** (filled `surface-green`, text-primary), the **picture** and the **line**:

| View | Selected chip | Picture | Line |
|---|---|---|---|
| 1 (default, `18:506`) | Residents | Philadelphia, City Hall (the one live now) | Find help, plan your visit, and talk to a real person. |
| 2 (`26:1758`) | Program Providers | a person walking into a building | Your policies, signed before they arrive. Check-in and go! |
| 3 (`26:1854`) | Case managers | a person with a bag and a phone in a lobby | Their plans, your guidance, in one place. |

Default is view 1. I could not read prototype links through the API (the set shows only the three variants), so how you move is by the chips, as I read it: **tap a chip to show its view; nothing navigates** (live today each chip is a link to a Support topic, which is what Will said is wrong). Suggested build: chips as buttons with `aria-pressed`; the picture, its `alt` and the line change together; keep the 12px ↗ on each chip as drawn (it reads as "link" — ask Will if it should go). Unselected chips: transparent, `border-green`, white text.

## Needs Sage (words not on the site yet, or different)
- View 2 line: "Your policies, signed before they arrive. Check-in and go!" (a promise about signing and check-in — Will signs promises)
- View 3 line: "Their plans, your guidance, in one place."
- Alt text for the two new pictures (none yet).
- Header link says "Support" in Figma, "Get help" live.
- Row 2 body: Figma "They sign your policies before arriving"; live "…before they visit". Row 3 body: Figma adds "cheer on every step"; live drops it.
- Callout card: Figma "Pam was designed for privacy, so anyone, regardless of background or history can feel safe using it." and "We’re here to help. Get 24/7 member support in English, Spanish, and five other languages"; live uses other words (the 24/7 line is already held in `HELD`).
- Footer copyright: Figma "Copyright @2026, All Rights Reserved"; live "© 2026 Pam. All rights reserved."

## Two cautions
- Figma's smaller buttons are 32 (Sign in), 36 (callout), 40 (footer link). The site's rule is a 48px tap target; keep the **drawn** size and pad the hit area to 48.
- The two new pictures are in Figma only (`26:1760`, `26:1856`); they need exporting to `public/home/` as webp at 390 and 780 wide.
