# D-546 — Text colour examples for Will (a65)

**Date:** 2026-10-12 · **Branch:** `claude/pam-design-colour-examples`

Will asked for examples before choosing two website text colours (card a65: "Colors, I'll need examples to make a call here"). The story **Website / Text colours (Will to choose)** puts each pair side by side at phone width, on the real surfaces, with the ratio and AA result worked out live from `website-palette.ts`.

- **Grey text on tinted cards.** Will's #666666 is 4.43:1 on Gray, 3.97 on Green and 4.35 on Purple, so it fails AA there; it passes on the page and the Muted card. The site's #595959 is 5.41, 4.84 and 5.31, and 6.2 on Muted.
- **Green text on white.** Will's #0B991F is 3.76:1 and fails; the site's #087A18 is 5.52:1.
- **Recommendation (not a decision).** #595959 for muted text on tinted cards and #087A18 for green text, because only they pass, and they look close to Will's. Icons and strokes keep #0B991F.

Nothing in the site's tokens changed. When Will decides, change `--website-text-muted(-strong)` / `--website-text-success` in `website.stylex.ts` and `website-palette.ts`; `website-tokens.test.ts` will say what breaks.
