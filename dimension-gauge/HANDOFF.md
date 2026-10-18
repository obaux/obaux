# Dimension gauge — handoff

Paste this file plus `dimension-gauge.js` to the AI that will integrate it into the app.

## What it is
A flat "liquid fill" circle that shows one life dimension's amount (0–100) on the insights report page. One gauge per dimension, with an icon overlaid in the centre. Recreated from a screen recording of a loader: a circle clipped to two flat sine-wave layers (pale back wave, solid front wave) that slosh while the level rises from empty. No gradients, no shadows on the fill.

## Files
- `dimension-gauge.js` — the whole component. A framework-free custom element, `<dimension-gauge>`. No dependencies, no build step. Shadow DOM, so app CSS can't break it.
- `demo.html` — six sample gauges with placeholder icons and a randomize button. Serve the folder over HTTP (ES module import) and open it.

## API
```html
<dimension-gauge value="72" label="Housing" show-value>
  <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">…</svg>
</dimension-gauge>
```
| Attribute / prop | Meaning |
|---|---|
| `value` (also `el.value = n`) | 0–100, clamped. Changing it tweens the level (~900 ms, ease-out). First paint always fills up from empty. |
| `label` | Accessible name. Set it. |
| `show-value` | Prints the rounded percent under the icon. |
| `static` | Disables wave motion. Also applied automatically under `prefers-reduced-motion`. |

CSS custom properties (set on the element or an ancestor): `--dg-size` (default 120px), `--dg-fill` (#4561de), `--dg-wave` (#bfe6ff), `--dg-track` (empty circle, translucent white), `--dg-icon` (#fff).

Slot content: any inline `<svg slot="icon">` using `currentColor`. It is sized to 34% of the circle. Use the app's own icon set.

## Behaviour details worth knowing
- Waves flatten near 0 and 100 so the circle reads truly empty / truly full.
- Animation runs on `requestAnimationFrame` and pauses when the element is off-screen (IntersectionObserver) or disconnected.
- Accessibility: host gets `role="meter"` with `aria-valuenow/min/max/valuetext`.
- Tuning: wave shape lives in the `BACK` / `FRONT` constants at the top of the JS (amplitude, wavelength, speed, phase, lift).

## Integration checklist for the receiving AI
1. Copy `dimension-gauge.js` into the app's frontend source and import it once (`import './dimension-gauge.js'`). In React, render `<dimension-gauge>` directly and set `value` as an attribute or via ref. Add a type declaration if using TypeScript.
2. Map each dimension in the app's data model to `{ label, value 0–100, icon }`. The dimension names, value scale and icon set were not provided, so nothing is wired to data yet.
3. Pick colours from the app's design tokens via the `--dg-*` variables. Defaults (royal blue on near-black navy) match the recording; the demo shows a teal variant.
4. Check contrast of the icon/number over both the fill and the empty track at your chosen colours.
5. For printed or reduced-motion contexts, use the `static` attribute (a still frame draws on connect).

## Not done / open
- Not integrated into any app page; standalone folder only. Nothing committed.
- Tested only in headless Chromium screenshots (rendering, icon overlay, level tween settling). Not tested in Safari/Firefox, on real devices, or for performance with many gauges on a page.
- Wave timing was matched by eye from the recording, not measured frame by frame.
- The `static` path draws a still frame, but I did not screenshot-test it separately.
