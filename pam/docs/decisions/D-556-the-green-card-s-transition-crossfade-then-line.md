# D-556 — The green card's transition: crossfade, then line

**Date:** 2026-10-13 · **Branch:** `claude/pam-design-card-motion`

Will (a80): "can we add smoother transitions between the slides?" The card swapped picture and line with a 240ms opacity fade on (0.2, 0, 0, 1), which is abrupt after a 6-second dwell. Story: **Website / Green card transition** (real time, and four times slower to see how it is made).

- **Picture:** crossfade, **650ms** on **cubic-bezier(0.4, 0, 0.2, 1)** (the app's own scroll ease, an ease-in-out). The new picture goes on top (z-index 2) and fades 0→1; the old one stays at opacity 1 underneath and drops to 0 at the end (`transition: opacity 0ms linear 650ms`), so the card's green never shows through. Two pictures each at half opacity would have let it (a 25% dip in the middle). Opacity only; no state or JS is needed: it is a transition on the class that marks the active picture.
- **No scale or drift.** Every picture has the same white rounded frame in the same place. A scale on the incoming one would make that frame grow and shrink and ghost against the old one. The frame staying still is what makes the change feel smooth.
- **Line:** the old line fades out in **160ms**, **cubic-bezier(0.4, 0, 1, 1)** (ease-in), and goes `visibility: hidden` at the end of it; the new line fades in over **320ms**, **cubic-bezier(0, 0, 0.2, 1)** (ease-out), starting after the 160ms delay, visible from the start. Two lines are never on screen together. The lines share one grid cell, so the card's height does not change. Opacity only.
- **Chip:** unchanged, 240ms on (0.2, 0, 0, 1), starts at once, so the tap is answered before the picture finishes.
- **Fill and the 6 seconds:** unchanged. The change begins when the fill ends. The fill stays on `width`: it is a tiny element inside the chip's `overflow: hidden`, so it moves nothing else, Mira measured zero layout shift on the real page, and a `scaleX` would need its origin flipped for right-to-left (`:dir(rtl)`), a risk for no gain. If a low-end phone shows jank, switch to `scaleX` then.
- **Reduced motion:** every transition is gated on `prefers-reduced-motion: no-preference`; with it on they are instant (and the cycle does not run).
- **Quick taps:** a second change in the middle of one retargets the transitions; at worst the picture still fading in stays under the next for its 650ms. No pop.
- Layout properties are never animated; `transform` is not used at all.
