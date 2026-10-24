# 2026-10-23 — website home hero mobile docusign tag

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** <see docs/lanes.md>

## What changed

Will, 23 October (Control Room, relayed by Mira). **Hero:** no picture carousel under 900px. `HeroPictures` (client) renders `FlipCarousel` only from 900px, so the images are not asked for on a phone; its place is held from first paint (4:5, up to 440px) so nothing moves on desktop. **DocuSign tag** on the programs row ("Your services, built around people."): Astryx `Badge` "Signing with DocuSign" and "Coming soon" (until `DOCUSIGN_LIVE` in `content/flags.ts` is true). **The logo is not in:** this machine cannot reach docusign.com, and the logo must be DocuSign's own file unchanged, so `DOCUSIGN.logo` in `content/docusign.ts` is null and the tag shows its words alone until the file is added. Pictures in `docs/design/review/2026-10-23-home-hero-docusign/`.

## What was wrong, and what missed it

## Decisions made

## Verified

site tests (127), tsc, build, usability (new: no carousel, no Pause button and no hero picture requested at 320, 390 and 899; carousel and Pause from 900; the tag and Coming soon; the a83 and layout-shift checks still pass), a11y (130 scans, 0 problems).

## Left undone

The DocuSign logo file (DocuSign's brand page), then set `DOCUSIGN.logo`. Sage signs “Signing with DocuSign”. Will's “under the dark green card, where the three statements are made” was read as the programs row, the one under the green card that talks about signing policies; say if he meant the green card's own Program Providers line.

## Needs a human

## 24 October addendum

The logo is in: Will gave it at 17:07 (Mira's `mira/docusign-logo`); the symbol is copied unchanged to `apps/site/public/brand/docusign-symbol.png` and `DOCUSIGN.logo` points at it (16px high, empty alt as the words say Docusign). It reads on the light and dark badge. Sage signed “Signing with Docusign” (2c0e66f9, the company's own spelling since its 2024 rebrand). The earlier “logo is not in” lines above are history. Pictures: `docs/design/review/2026-10-24-docusign-logo-on-tag/`. Checks: site tests, tsc, usability, a11y (130 scans) and scrollspy (0 problems).
