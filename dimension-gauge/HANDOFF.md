# Dimension gauge — handoff

Start with **README.md** (how it works, full reference, customization recipes). This file is the short brief: what was decided, what is still open, and what to do first.

## What was built
A flat liquid-fill circle (`<dimension-gauge>`) for the insights report page, one per life dimension, with an icon overlaid. Recreated from a screen recording of a loader, then adapted:
- No percentage or label text inside or under it. The app UI adds those.
- One colour token, `--dg-color`. Everything else (pale back wave) derives from it.
- Never fills to the top: `max-fill` defaults to 92.
- Appears by filling slowly from empty in eased micro-steps (7 s, 5 steps by default), staggered across the ten dimensions, starting when each gauge is on screen.
- Likert answers map to three buckets (weak / steady / strong). The score sets the level; the bucket sets how lively the water moves.

A shareable demo page exists as a Claude artifact (private; owner shares it). It includes the component source, the scoring source, a live Likert demo, a ten-dimension staggered report, and a customization playground.

## Decisions still open (need a product answer)
These are placeholders in the code, marked `TODO(product)` in `likert.js`:
1. **Likert scale**: assumed 1–5. Change `min` / `max` for 1–7 etc.
2. **Bucket cut points**: weak < 40, steady 40–69, strong ≥ 70 (on 1–5: mean < 2.6 / 2.6–3.7 / ≥ 3.8). Placeholders.
3. **Items per dimension, weighting, reverse-coded items**: assumed equal weights; reverse-coded items are passed per call (`reverse: [indexes]`).
4. **Same cut points for every dimension?** Currently yes.
5. **Fill height**: currently the real score (capped at 92). Alternative: buckets set fixed levels (e.g. 24 / 56 / 84).
6. **The real ten dimensions** (names, icons, which questions feed each). The demos use invented placeholders.
7. **Colour**: `#4561de` is sampled from the original recording, not a brand colour. Map `--dg-color` to a design-system token (optionally one per dimension).
8. **Dark / light**: the demos are dark. On light surfaces set `--dg-track` and `--dg-icon` (see README recipes) and check icon contrast over fill and track.

## Integration checklist
1. Copy `dimension-gauge.js` and `likert.js` into the app's frontend source. Import `dimension-gauge.js` once.
2. Set `--dg-color` (and `--dg-track`, `--dg-icon`, `--dg-size`) from the design system.
3. Resolve the open decisions above, then update `likert.js` defaults.
4. On the report page, render all ten gauges with final `value` and `energy` already set (from `scoreDimension` → `gaugeProps`), with `delay = index * 320`. Do not render at 0 and update afterwards.
5. Give each gauge a `label` for screen readers; render visible names and numbers in the app UI (the `fillend` event can reveal them after the fill).
6. Run `node dimension-gauge.test.mjs && node likert.test.mjs`.
7. Test on Safari, Firefox and real phones, and with `prefers-reduced-motion` on.

## Known gaps
- Not integrated into any app page; this folder is standalone (branch `claude/dimension-gauge`, nothing merged).
- Verified in headless Chromium only: rendering, icon overlay, stepped fill timing, staggering, `fillstart`/`fillend`, `replay()`, attribute overrides, reduced motion. Not tested in Safari or Firefox, on devices, or with dozens of gauges.
- Wave motion and timing were matched by eye from the recording, not measured frame by frame.
