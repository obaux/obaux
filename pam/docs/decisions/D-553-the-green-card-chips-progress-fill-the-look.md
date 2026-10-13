# D-553 — The green card chips' progress fill: the look

**Date:** 2026-10-13 · **Branch:** `claude/pam-design-card-progress`

Will (a77, 13 October): the website's green card chips switch by themselves, "a progress translucent effect behind chips"; tapping one pauses. Wren builds it; this is the look. Story: **Website / Green card chip progress** (`States`, and `Running` to see it move).

- **Active chip:** keeps the design's selected look (`surface-green`, `text-primary`). The text is above both layers, so it never changes colour while the fill runs.
- **Fill:** a translucent layer behind the text, from the inline start edge to the end over **6000ms** (the hero carousel's `AUTO_MS`), **linear**. Light: `#004033` at 28% (the chip goes from #BCE0BB to #87b395); text 14.52:1 plain, 8.91:1 fully filled. Dark: `#FFFFFF` at 22% (#2B422B to #5a6c5a); text 10.96:1 plain, 5.63:1 filled. Both AA.
- **Direction:** `inset-inline-start: 0` and a growing `width`: left to right in English, right to left in Arabic, with no per-language code.
- **Easing:** the fill is linear (it is time). The chip that was active lets go of its fill and colour over 240ms on (0.2, 0, 0, 1), the site's arriving timing.
- **Paused by the control:** the fill stays where it is; the button says Play. **Paused by a tap on a chip:** that chip is selected with no fill, the card is paused. Play (either way) starts the active chip's 6s again.
- **Control:** the hero carousel's Pause/Play pill (veil fill, `border-strong` hairline, 14px mark, `label_14`, 40px tall, 48px target), at the top end of the card's picture. Hidden under reduced motion, where there is no fill and no auto-advance, as on the hero.
- **Words:** the carousel's labels are "Pause pictures" / "Play pictures"; the card needs its own pair. New English, so Sage signs it (A29).

**To look at before building:** in dark the plain selected chip (#2B422B on the #004033 card) is 1.08:1 against the card; only its border tells it from the others until the fill runs. Not changed here; Will may want a stronger dark selected fill.
