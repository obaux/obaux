# D-550 — The website's phone layout follows Figma 7:3 and the green card switches between three views

**Date:** 2026-10-13 · **Branch:** `claude/compassionate-bohr-mzrchf` · **Held off `main` until Will has seen it.**

**Decided by Will, 12 October 2026 (06:58 ET):** "The site colors are not my concern right now. More importantly is the mobile layout not matching Figma. The text and elements are too large. … Also the Green component does not redirect to help desk, it shows different views as per this component (Callout card, 18:517)."

**What.**
1. Phone sizes from Figma `Home — Phone 390` (7:3), with Dot's spec: header 48 high; hero lead 17/24; the green card's picture 229, text 32/20/48, chips 14/20 with 6×12 padding, line 20/28; feature rows with 12px card edges, 24px text inset, 20px gaps, 24px panel radius, full-pill 54px buttons; callout text bold 17/24 with a plain 1px rule and 36px buttons; a centred footer column (wordmark 36, tagline 14, links 17 underlined, copyright 12 at 70%). From 900px the desktop sizes are unchanged. Colours are unchanged.
2. The green card (`BandViews`) is a tab set: Residents, Program Providers, Case managers. Choosing one changes the picture and the line (crossfade 240ms, none under reduced motion); nothing navigates. The three lines share one grid cell so the card does not change height.
3. The 48px tap rule stays where Figma draws 32, 34, 36: the drawn chip, Sign in and callout buttons are Figma's size inside a transparent 48px tap box.

**Why not the Figma carousel-less hero.** Figma hides the hero picture block. Will asked for the flipping carousel on 11 October and has not withdrawn it, so it stays.

**Waiting on words (Sage; Will signs promises).** "Your policies, signed before they arrive. Check-in and go!" (a promise), "Their plans, your guidance, in one place.", the alt texts of the two new pictures. The header says "Get help" (Figma "Support"), the row-2 and row-3 and privacy-callout words follow Will's a65.

**What a later session might reverse.** The 48px tap boxes if Will accepts 32/36 targets; the carousel if he wants the hero to match Figma exactly; the ↗ on each name (Dot suggests asking Will).
