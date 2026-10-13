# D-550 — The website's phone layout follows Figma 7:3 and the green card switches between three views

**Date:** 2026-10-13 · **Branch:** `claude/compassionate-bohr-mzrchf` · **Held off `main` until Will has seen it.**

**Decided by Will, 12 October 2026 (06:58 ET):** "The site colors are not my concern right now. More importantly is the mobile layout not matching Figma. The text and elements are too large. … Also the Green component does not redirect to help desk, it shows different views as per this component (Callout card, 18:517)."

**What.**
1. Phone sizes from Figma `Home — Phone 390` (7:3), with Dot's spec: header 48 high; hero lead 17/24; the green card's picture 229, text 32/20/48, chips 14/20 with 6×12 padding, line 20/28; feature rows with 12px card edges, 24px text inset, 20px gaps, 24px panel radius, full-pill 54px buttons; callout text bold 17/24 with a plain 1px rule and 36px buttons; a centred footer column (wordmark 36, tagline 14, links 17 underlined, copyright 12 at 70%). From 900px the desktop sizes are unchanged. Colours are unchanged.
2. The green card (`BandViews`) is a tab set: Residents, Program Providers, Case managers. Choosing one changes the picture and the line (crossfade 240ms, none under reduced motion); nothing navigates. The three lines share one grid cell so the card does not change height.
3. The 48px tap rule stays where Figma draws 32, 34, 36: the drawn chip, Sign in and callout buttons are Figma's size inside a transparent 48px tap box.

**Why not the Figma carousel-less hero.** Figma hides the hero picture block. Will asked for the flipping carousel on 11 October and has not withdrawn it, so it stays.

**Will's answers to card a77 (13 October, 03:21).** "Okay we can take off the arrows but let's add a progress translucent effect behind chips because they should automatically switch from one to the next. If the user taps on one, it pauses the progress. Everything else looks good." So: the ↗ is gone from the three names; the card moves on by itself every 6 seconds (Residents, Program Providers, Case managers, round again), a translucent fill growing across the active name shows the time left (the fill's own `animationend` is the timer, so the two cannot drift); a tap, an arrow key or the Pause pill stops the cycle until Play. It also waits while the pointer or keyboard focus is in the card and while it is off screen. Reduced motion: no cycle, no fill, no pill. A screen reader is told only what a person chose. The header says "Support"; Sage's signed words are in (b8067c7e), including "Check in and go!".

**Waiting on words (Sage; Will signs promises).** "Your policies, signed before they arrive. Check-in and go!" (a promise), "Their plans, your guidance, in one place.", the alt texts of the two new pictures. The header says "Get help" (Figma "Support"), the row-2 and row-3 and privacy-callout words follow Will's a65.

**What a later session might reverse.** The 48px tap boxes if Will accepts 32/36 targets; the carousel if he wants the hero to match Figma exactly; the ↗ on each name (Dot suggests asking Will).

**The pill's words.** Will, 13 October 05:44, on a80: "revert back the tag button 'Play this card', even better just say 'Play Card' or 'Pause card' instead of 'Pause/Play who Pam is'. The new label live is not intuitive." The green card's pill reads "Pause card" and "Play card"; the visible label is also the spoken name (WCAG 2.5.3). It differs from the hero's "Pause pictures" / "Play pictures" so the two Pause buttons on Home can be told apart. Sage records the words in the ledger.
