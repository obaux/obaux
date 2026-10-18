# Dimension gauge — handoff

Paste this file plus `dimension-gauge.js` to the AI that will integrate it into the app.

## What it is
A flat "liquid fill" circle that shows one life dimension's amount (0–100) on the insights report page. One gauge per dimension, with an icon overlaid in the centre. It deliberately has no percentage or label text; the app UI adds those around it. Recreated from a screen recording of a loader: a circle clipped to two flat sine-wave layers (pale back wave, solid front wave) that slosh while the level rises from empty. No gradients, no shadows on the fill.

## Files
- `dimension-gauge.js` — the whole component. A framework-free custom element, `<dimension-gauge>`. No dependencies, no build step. Shadow DOM, so app CSS can't break it.
- `likert.js` / `likert.test.mjs` — Likert scoring and bucketing (see below).
- `demo.html` — six sample gauges with placeholder icons and a randomize button. Serve the folder over HTTP (ES module import) and open it.

## API
```html
<dimension-gauge value="72" label="Housing">
  <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">…</svg>
</dimension-gauge>
```
| Attribute / prop | Meaning |
|---|---|
| `value` (also `el.value = n`) | 0–100, clamped. Changing it tweens the level (~900 ms, ease-out). First paint always fills up from empty. |
| `label` | Accessible name. Set it. |
| `max-fill` | Highest level the circle can reach. Default **92**, so a gauge never fills to the top (there is always room to grow). `max-fill="100"` allows a full circle. `aria-valuenow` still reports the real value. |
| `energy` | Wave liveliness 0.4–1.6, default 1. Used for the weak (0.6) / steady (1) / strong (1.35) examples. |
| `static` | Disables wave motion. Also applied automatically under `prefers-reduced-motion`. |

CSS custom properties (set on the element or an ancestor): `--dg-size` (default 120px), `--dg-color` (#4561de), `--dg-track` (empty circle, translucent white), `--dg-icon` (#fff). Optional `--dg-wave` overrides the pale back wave.

Slot content: any inline `<svg slot="icon">` using `currentColor`. It is sized to 34% of the circle. Use the app's own icon set. The `label` attribute is announced to screen readers only; nothing visible is drawn.

## Likert -> bucket -> gauge
`likert.js` (pure functions, tested by `likert.test.mjs`, run with `node likert.test.mjs`):
1. Each dimension is several Likert items. Unanswered or out-of-range items are ignored. Items listed in `reverse` are flipped (`min + max - answer`).
2. Mean of the answers, rescaled to a 0–100 score: `(mean - min) / (max - min) * 100`, rounded. No answers gives `score: null`.
3. Bucket from the score: **weak** < 40, **steady** 40–69, **strong** >= 70 (on a 1–5 scale that is mean < 2.6 / 2.6–3.7 / >= 3.8).
4. `gaugeProps()` returns `{ value: score, energy }` with energy 0.6 / 1 / 1.35 for weak / steady / strong. The gauge fill height is the real score (capped at 92); the bucket only changes how the water moves.

Assumptions to confirm (marked `TODO(product)` in the code): the scale is 1–5, the cut points are 40 and 70, and every dimension's items are weighted equally. The survey's actual scale, item count per dimension, reverse-coded items and whether dimensions share the same cut points were not provided.

Alternative if buckets should drive the fill too: map weak / steady / strong to fixed levels (e.g. 24 / 56 / 84) instead of the exact score.

## Behaviour details worth knowing
- Waves flatten near 0 and 100 so the circle reads truly empty / truly full.
- Animation runs on `requestAnimationFrame` and pauses when the element is off-screen (IntersectionObserver) or disconnected.
- Accessibility: host gets `role="meter"` with `aria-valuenow/min/max/valuetext`.
- Tuning: wave shape lives in the `BACK` / `FRONT` constants at the top of the JS (amplitude, wavelength, speed, phase, lift).

## Integration checklist for the receiving AI
1. Copy `dimension-gauge.js` into the app's frontend source and import it once (`import './dimension-gauge.js'`). In React, render `<dimension-gauge>` directly and set `value` as an attribute or via ref. Add a type declaration if using TypeScript.
2. Map each dimension in the app's data model to `{ label, value 0–100, icon }`. The dimension names, value scale and icon set were not provided, so nothing is wired to data yet.
3. **Colour token:** the gauge has one brand colour, `--dg-color`. Point it at the design-system token (e.g. `dimension-gauge{--dg-color:var(--ds-color-…)}`, or per dimension). The pale back wave is derived automatically (`--dg-color` mixed with white), so nothing else needs changing. `#4561de` is only a placeholder taken from the recording.
4. Check contrast of the icon over both the fill and the empty track at your chosen colours.
5. For printed or reduced-motion contexts, use the `static` attribute (a still frame draws on connect).

## Not done / open
- Not integrated into any app page; standalone folder only (branch `claude/dimension-gauge`).
- Tested only in headless Chromium screenshots (rendering, icon overlay, level tween settling). Not tested in Safari/Firefox, on real devices, or for performance with many gauges on a page.
- Wave timing was matched by eye from the recording, not measured frame by frame.
- The `static` path draws a still frame, but I did not screenshot-test it separately.
