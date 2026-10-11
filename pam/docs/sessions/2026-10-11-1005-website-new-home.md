# 2026-10-11 — website: the new Home (stage 1 of Will's Figma build)

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** Public website (Wren), job from Will via the merge desk (09:17 UTC)

## What changed

- New Home from the Figma (24:575 desktop, 7:3 phone) on Dot's Website tokens (D-528); words in `content/home-copy.ts` with `HELD` lines and true fallbacks; `test/home-copy.test.ts`.
- New header and footer for every page (`SiteNav`, `SiteFooter`, `WebFrame`, `SoftButton`, `PhonePanel`, `Reveal`); `LegalLink` has `footer` and `soft` faces.
- `FlipCarousel`: the hero pictures (tap/flip/float, Pause, reduced motion).
- Images: `public/home/` (Philadelphia 900/1600, three phone screens 390/780, 270 KB), `screenshots.json` entries to retake the screens.
- Probe fix for the help-request function (e27694a2, earlier in the day) and the SP1–SP5 scrollspy fixes are on the same branch.
- `@pam/ui/icons` export (additive).

## What was wrong, and what missed it

- Figma's asset URLs return 403 here; images came through `get_screenshot` (the PNG lands on disk). Only Home of the Figma is the new design; the other frames carry call-Pam words and are rebuilt in stages 2–4 with the live words.
- A `@pam/ui` barrel import pulled client code into a server component and failed the build; the `./icons` subpath fixed it.
- The footer links first rendered dark on dark (Astryx `Link` ignores a colour override); plain anchors on the tokens fixed it, found by looking at the screenshot.

## Decisions made

D-531.

## Verified

Site tests 92; typecheck; build; a11y axe 120 scans 0 problems (Home included, light and dark, phone and 320); usability.mjs clear (48px targets, focus rings, layout shift under 0.1); scrollspy.mjs. Screenshots at 390 and 1440, light and dark, and a short recording of the carousel: `docs/screens/website-new/home/`.

## Left undone

Stages 2–4 (Support index and post template, About Pam, Still stuck). Held lines wait for Will's cards. The globe button (second language). A link to About Pam (the design has none). Alt texts of the three phone screens are mine: for Sage to sign.

## Needs a human

Will: the five held lines (`HELD`).
