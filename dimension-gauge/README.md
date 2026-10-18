# dimension-gauge

A flat "liquid fill" circle that shows one life dimension's amount on an insights report page. One per dimension, with an icon overlaid in the centre. When it appears, the water rises slowly from empty in small eased steps, then keeps gently swelling. It never fills to the very top: there is always room to grow.

No dependencies, no build step, no framework. A single custom element plus a tiny scoring module.

## Files

| File | What it is |
|---|---|
| `dimension-gauge.js` | The `<dimension-gauge>` element. Everything visual and all motion. |
| `likert.js` | Pure functions: Likert answers → 0–100 score → weak / steady / strong → gauge props. |
| `dimension-gauge.test.mjs`, `likert.test.mjs` | Node tests (`node <file>`). No test runner needed. |
| `demo.html` | Five gauges scored from sample answers, staggered, with replay. Serve over HTTP: `python3 -m http.server`. |
| `HANDOFF.md` | Decisions made, open questions, integration checklist. Start here if you are taking this over. |

## Quick start

```html
<script type="module" src="./dimension-gauge.js"></script>

<style>
  dimension-gauge { --dg-size: 120px; --dg-color: var(--your-brand-token); }
</style>

<dimension-gauge value="72" label="Housing">
  <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">…</svg>
</dimension-gauge>
```

From survey answers:

```js
import { scoreDimension, gaugeProps } from './likert.js';

const result = scoreDimension([4, 5, 2], { min: 1, max: 5, reverse: [2] }); // { score, bucket, answered, total }
const { value, energy } = gaugeProps(result);                                 // → attributes for the element
```

## How it works

```
Likert answers ──► scoreDimension() ──► score 0–100 ──► bucket (weak | steady | strong)
                    likert.js                                 │
                                                              ▼
                                         gaugeProps() → { value: score, energy: 0.6 | 1 | 1.35 }
                                                              │
                                                              ▼
                                         <dimension-gauge value energy delay …>   dimension-gauge.js
```

**The score sets how high; the bucket sets how it moves.** `value` is the real score. `energy` comes from the bucket (weak = slow shallow waves, strong = brisk taller waves).

**The ceiling.** `value` is clamped to `max-fill` (default 92) before it is drawn, so even a perfect score leaves the top open. `aria-valuenow` still reports the real score.

**Drawing.** Each frame the element rebuilds two SVG paths from sine waves at the current level: a pale back wave and a solid front wave, both clipped to the circle. The back wave sits a little higher and moves against the front, so a pale sliver shows above the solid colour. No canvas, no images.

**The first fill.** This is the "gradually loading" animation:

```
 element enters the DOM ──► waits until it is on screen (IntersectionObserver)
                        ──► waits `delay` ms
                        ──► runs for `fill-duration` ms, split into `steps` equal time slices

 one slice:   |── ease in ── rise ── ease out ──|──── hold ────|
              |<────── stepMove (68%) ─────────>|<── 32% ─────>|

 level over time (5 steps):                          ╭──────
                                               ╭─────╯
                                         ╭─────╯
                                   ╭─────╯           ← each rise is smaller than the last (taper)
                             ╭─────╯
                  ───────────╯
```

- Step sizes taper (first is biggest, last smallest) so the water seems to slow as it nears its level. A small per-gauge jitter, seeded from the value, keeps ten gauges from moving in lockstep.
- While the level moves the waves swell slightly; during holds they calm. This is smoothed so it never pops.
- The last step has no hold, so the fill lands exactly on the value.

**After the first fill.** Changing `value` plays one smooth tween (max `updateDuration`, 1400 ms). Waves keep moving.

**Reduced motion.** Under `prefers-reduced-motion: reduce`, or with the `static` attribute, the gauge draws at its final level immediately: no stagger, no waves, no tween.

**Off-screen.** Nothing animates until the gauge is on screen, and the frame loop pauses when it leaves. Gauges below the fold fill as they are scrolled to.

## Reference

### Attributes

Each attribute overrides the matching `DimensionGauge.defaults` key for that one element.

| Attribute | Default | Meaning |
|---|---|---|
| `value` | 0 | The score, 0–100. Also settable as `el.value = n`. |
| `label` | – | Accessible name. Announced by screen readers; nothing visible is drawn. **Set it.** |
| `max-fill` | 92 | Highest level the circle can reach. `100` allows a full circle. |
| `energy` | 1 | Wave liveliness, 0.4–1.6. Scales wave speed and height. |
| `fill-duration` | 7000 | ms for the first fill from empty. |
| `steps` | 5 | Micro-steps in the first fill, 1–12. `1` = a single smooth rise. |
| `delay` | 0 | ms before the first fill starts. Stagger a row with `delay = index * 320`. |
| `static` | off | Boolean. No animation at all. |

### CSS custom properties

Set on the element or any ancestor.

| Property | Default | Meaning |
|---|---|---|
| `--dg-size` | `120px` | Diameter. |
| `--dg-color` | `#4561de` | The brand colour: the solid front wave. **Point this at your design token.** |
| `--dg-wave` | `--dg-color` mixed 75% with white | The pale back wave. Only set it if you want a specific colour. |
| `--dg-track` | `rgba(255,255,255,.08)` | The empty part of the circle. Use something that reads on your background (e.g. a tinted neutral on light themes). |
| `--dg-icon` | `#fff` | Icon colour. Slotted SVGs should use `currentColor`. |

### CSS parts

For anything the variables don't cover: `dimension-gauge::part(track)`, `::part(back)`, `::part(front)`.

```css
dimension-gauge::part(track) { stroke: rgb(255 255 255 / .15); stroke-width: 1; }  /* a ring */
```

### Slot

`<svg slot="icon">` (any inline element). Centred and sized to 34% of the circle. Use `currentColor` so `--dg-icon` controls it. The element ignores pointer events on the overlay.

### Events and methods

| | |
|---|---|
| `fillstart` | Fires when the first fill is scheduled (after the gauge is on screen). `detail.value` = target level. |
| `fillend` | Fires when the first fill lands. Bubbles and is `composed`. Use it to reveal a number or caption. Not fired for later `value` changes. |
| `el.replay()` | Empties the circle and runs the first fill again (when on screen). |
| `el.value` | Get / set the score. |

### `DimensionGauge.defaults`

Every tunable number in one object. Edit it once at startup; it is read when each gauge starts its first fill, so changes apply to gauges that have not started yet.

```js
import { DEFAULTS } from './dimension-gauge.js';   // or customElements.get('dimension-gauge').defaults
Object.assign(DEFAULTS, { fillDuration: 9000, steps: 6 });
```

| Key | Default | Effect |
|---|---|---|
| `maxFill`, `energy`, `fillDuration`, `steps`, `delay` | see attributes | Same as the attributes. |
| `updateDuration` | 1400 | ms cap for a `value` change after the first fill. |
| `stepMove` | 0.68 | Share of each step spent rising; the rest is a pause. `1` removes pauses. |
| `stepTaper` | 0.55 | How much bigger earlier steps are than later ones. `0` = equal steps. |
| `stepJitter` | 0.3 | Per-gauge randomness in step sizes. `0` = every gauge identical. |
| `updateEasePower` | 2.2 | Ease-out curve for later value changes. |
| `swell` | 0.3 | Extra wave height while the level is moving. `0` = waves ignore motion. |
| `flattenBelow` | 6 | Waves flatten within this many % of 0 and 100 so empty reads as empty. |
| `waves.back`, `waves.front` | see file | `amp` (height, in a 100-wide viewBox), `k` (wavelengths across the circle), `speed` (rad/s, negative reverses), `phase`, `lift` (raises the layer above the level). |
| `points` | 48 | Points per wave path. More = smoother, a little more work per frame. |

## Recipes

**Brand colour from your design system.** One token. The pale back wave is derived from it.
```css
dimension-gauge { --dg-color: var(--ds-color-primary); }
```

**A different colour per dimension.**
```css
dimension-gauge[label="Housing"] { --dg-color: var(--ds-color-housing); }
```
or set `style="--dg-color: …"` on each element from your data.

**Light backgrounds.** Give the empty track and icon colours that read on light:
```css
dimension-gauge { --dg-track: rgb(69 97 222 / .12); --dg-icon: var(--ds-color-text); }
```
Check icon contrast over both the fill and the empty track.

**Slower, calmer, more or fewer steps.** `fill-duration="10000" steps="7" energy="0.7"`.

**No pauses, just one smooth rise.** `steps="1"`, or `Object.assign(DEFAULTS, { stepMove: 1 })` to keep the steps without the holds.

**Equal steps on every gauge.** `Object.assign(DEFAULTS, { stepTaper: 0, stepJitter: 0 })`.

**Different wave shape.** Edit `DEFAULTS.waves`: longer swell (`k: 0.7`), taller (`amp: 6`), faster (`speed: 2.5`). Keep the back layer's `lift` positive so its sliver shows.

**Allow a full circle.** `max-fill="100"` (or `DEFAULTS.maxFill = 100`).

**Reveal a number after the water settles.**
```js
report.addEventListener('fillend', e => e.target.closest('.dim').classList.add('show-score'));
```

**Replay when the user returns to the tab / re-opens the report.** `document.querySelectorAll('dimension-gauge').forEach(g => g.replay())`.

**Different stagger order.** The stagger is just the `delay` you set. Order by score, by dimension, or random: `delay = rank * 320`.

**Change the weak / steady / strong cut points, scale, or reverse-coded items.** Pass options to `scoreDimension(answers, { min, max, reverse, weakBelow, strongFrom })`; defaults and `TODO(product)` notes are at the top of `likert.js`.

## Using it in a framework

It is a standard custom element, so it renders anywhere. Import the file once, then use the tag.

- **React 19**: `<dimension-gauge value={v} energy={e} delay={i * 320} label={name}>`. On React 18 and earlier, attributes are strings; set values through attributes or a ref (`ref.current.value = v`) and listen for `fillend` with `addEventListener` in an effect.
- **Vue / Svelte / Angular**: use the tag directly (Vue: add `dimension-gauge` to `compilerOptions.isCustomElement`; Angular: `CUSTOM_ELEMENTS_SCHEMA`).
- **TypeScript + JSX**: declare the element so props type-check:
  ```ts
  declare global { namespace JSX { interface IntrinsicElements {
    'dimension-gauge': React.HTMLAttributes<HTMLElement> & {
      value?: number; label?: string; energy?: number; delay?: number;
      'max-fill'?: number; 'fill-duration'?: number; steps?: number; static?: boolean;
    };
  } } }
  ```
- **SSR**: the circle is drawn by the element's shadow DOM, so server-rendered HTML contains only the tag and its icon until the script upgrades it on the client. Reserve the space with `--dg-size` to avoid layout shift. Importing `dimension-gauge.js` on a server is safe; it skips the DOM parts when none exists.
- **Rendering all ten**: render each element with its final `value` and `energy` already set. Do not set `value` to 0 first and then update it. The element always fills from empty by itself, and a later `value` change would use the short tween instead of the slow fill.

## Behaviour notes and limits

- Changing `value` before the gauge has started filling just changes the target. Changing it mid-fill ends the stepped fill and tweens from the current level to the new one.
- Timing uses the clock, not frame count, so a hidden tab catches up when it returns.
- Roles: the host gets `role="meter"` with `aria-valuemin/max/now/text`. The icon is decorative unless you give it its own label.
- Not yet tested: Safari and Firefox, real phones, or performance with many gauges. The wave paths are rebuilt every frame (~100 points per gauge), which is cheap for ten but worth profiling if you put dozens on a page.
- `color-mix()` derives the back wave. It is supported in current browsers; set `--dg-wave` explicitly if you must support older ones.

## Tests

```sh
node dimension-gauge.test.mjs   # step sizes, taper, jitter, plateaus, monotonic rise
node likert.test.mjs            # scoring, reverse-coding, skipped items, buckets
```

The element itself needs a browser. Quick visual check: serve this folder and open `demo.html`.
