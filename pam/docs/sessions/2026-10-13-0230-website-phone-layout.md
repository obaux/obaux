# 2026-10-13 — website phone layout

**Branch:** `claude/compassionate-bohr-mzrchf` · **Lane:** public website (Wren)

## What changed

- Job 1 (SHA bd6d016a, D-548): About Pam's carousel words are back, the line between the tabs and the carousel is gone, `about.how.*` deleted from seven bundles and the ledger. Lena did the same on her branch; Mira resolves.
- Job 3 (D-550, held for Will): the Home phone layout from Figma 7:3 and Dot's spec; `BandViews`, the green card as three tabs with the Program Providers and Case managers pictures (`public/home/band-*-630.webp`, from Figma at 630 wide).
- Review pictures: `docs/design/review/2026-10-13-website-phone/` (before and after at 390 and 320, the card's three views).

## What was wrong, and what missed it

On 10 October the carousel's words were removed instead of the line between the carousel and the tabs. The green card linked each name to a Support topic where Will wanted three views.

## Decisions made

D-548, D-550.

## Verified

Web tsc, web unit 139, config 1176, ui 124 (job 1). Site tests 94, tsc, build, a11y 120 scans 0 problems, usability clear, scrollspy at 320/390/1280.

## Left undone

The fit audit for about.* (needs a Storybook build). Sage's signing of the two card lines and the alt texts. The desktop green card is the same switcher at the old desktop sizes, not re-checked against Figma 18:517 desktop.

## Needs a human

Will: look at the review pictures; sign "Your policies, signed before they arrive. Check-in and go!".
