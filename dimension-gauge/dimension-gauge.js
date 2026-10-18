/**
 * <dimension-gauge> — flat "liquid fill" circle for showing one life dimension's amount.
 *
 *   <dimension-gauge value="72" label="Housing" energy="1" delay="320">
 *     <svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">…</svg>
 *   </dimension-gauge>
 *
 * HOW IT WORKS (read this first)
 *   1. `value` (0–100) is the score. It is clamped to `max-fill` (default 92) so the circle never
 *      reaches the top: there is always room to grow. `aria-valuenow` still reports the real score.
 *   2. Drawing is two flat SVG paths (a pale back wave, a solid front wave) clipped to a circle.
 *      Every frame we rebuild both paths from sine waves at the current level. No images, no canvas.
 *   3. On first appearance the level rises from empty to `value`. That is the "first fill":
 *        - it waits until the element is on screen (IntersectionObserver), then waits `delay` ms;
 *        - it lasts `fill-duration` ms, split into `steps` micro-steps. Each step eases in, rises,
 *          eases out, then holds briefly; later steps are smaller, so the fill tapers.
 *   4. After the first fill, changing `value` plays one short smooth tween instead.
 *   5. Waves keep gently moving after the fill (unless `static` or prefers-reduced-motion).
 *   Under prefers-reduced-motion (or `static`) the gauge draws at its final level with no motion.
 *
 * ATTRIBUTES (all optional except `label`; each overrides DimensionGauge.defaults for that element)
 *   value          0–100. The score.
 *   label          Accessible name, e.g. "Housing". Announced by screen readers; nothing visible is drawn.
 *   max-fill       Highest level the circle can reach, 0–100. Default 92. "100" allows a full circle.
 *   energy         Wave liveliness 0.4–1.6. Default 1. Low = slow, shallow swell; high = brisk, taller.
 *   fill-duration  ms for the first fill from empty. Default 7000.
 *   steps          Micro-steps in the first fill, 1–12. Default 5. "1" = one smooth rise.
 *   delay          ms to wait before the first fill starts. Stagger a row with delay = index * 320.
 *   static         Boolean. No animation at all.
 *
 * CSS CUSTOM PROPERTIES (set on the element or any ancestor)
 *   --dg-size   Diameter. Default 120px.
 *   --dg-color  The one brand color (solid front wave). Default #4561de. Point this at a design token.
 *   --dg-wave   Pale back wave. Default: --dg-color mixed 75% with white.
 *   --dg-track  The empty circle. Default translucent white.
 *   --dg-icon   Icon color. Default #fff.
 *
 * CSS PARTS (for anything the variables don't cover): dimension-gauge::part(track | back | front)
 *   e.g. dimension-gauge::part(track){ stroke:#fff3; stroke-width:1 }
 *
 * JS API
 *   el.value = 80          Same as setting the attribute.
 *   el.replay()            Empty the circle and run the first fill again (when on screen).
 *   'fillstart' / 'fillend' events (bubble, composed). `fillend` fires when the first fill finishes;
 *                          detail = { value }. Use it to reveal a number or caption afterwards.
 *   DimensionGauge.defaults  Every tunable number, documented below. Change it once at startup:
 *                          customElements.whenDefined('dimension-gauge').then(() =>
 *                            Object.assign(customElements.get('dimension-gauge').defaults, { fillDuration: 9000 }));
 *
 * No dependencies. One file. Works in any framework as a plain custom element.
 */

// ---------------------------------------------------------------------------------------------
// Tunables. Attributes override the matching key per element. Read lazily, so edits apply to
// gauges that have not started their first fill yet.
// ---------------------------------------------------------------------------------------------
const DEFAULTS = {
  maxFill: 92,          // attr max-fill. Level ceiling, 0–100.
  energy: 1,            // attr energy. Wave liveliness multiplier (0.4–1.6).
  fillDuration: 7000,   // attr fill-duration. ms, first fill.
  steps: 5,             // attr steps. Micro-steps in the first fill.
  delay: 0,             // attr delay. ms before the first fill starts.
  updateDuration: 1400, // ms cap for the tween when `value` changes after the first fill.

  stepMove: 0.68,       // Share of each step spent rising; the rest is a pause. 1 = no pauses.
  stepTaper: 0.55,      // How much bigger earlier steps are than later ones. 0 = all steps equal.
  stepJitter: 0.3,      // Per-gauge randomness in step sizes (0 = identical for every gauge).
  updateEasePower: 2.2, // Ease-out curve for later value changes. Higher = faster start, softer landing.

  swell: 0.3,           // Extra wave height while the level is moving. 0 = waves never change with motion.
  flattenBelow: 6,      // Waves flatten within this many % of 0 and 100 so the circle reads empty / full.

  // Wave layers. amp: height in viewBox units (circle is 100 wide). k: wavelengths across the circle.
  // speed: radians per second (negative = moves the other way). phase: start offset. lift: raises the
  // layer above the level. The back layer sits a little higher and moves against the front.
  waves: {
    back:  { amp: 4.2, k: 1.15, speed: -1.7, phase: 1.3, lift: 2.2 },
    front: { amp: 3.6, k: 1.0,  speed:  1.4, phase: 0,   lift: 0 },
  },
  points: 48,           // Points per wave path. More = smoother, slightly more work per frame.
};

const R = 50;           // SVG viewBox is 100x100; circle radius is 50.
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const easeInOut = t => 0.5 - 0.5 * Math.cos(Math.PI * t);
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Level fraction (0–1) at overall progress p (0–1) for a stepped fill.
 * The fill is `weights.length` equal time slices. Slice i raises the level by weights[i] while it is
 * in its first `move` share (ease in-out), then holds until the next slice. The last slice never holds.
 * Exported for tests.
 */
export function stepped(p, weights, move = DEFAULTS.stepMove) {
  const n = weights.length, x = clamp(p, 0, 1) * n, i = Math.min(n - 1, Math.floor(x));
  const u = x - i, mv = i === n - 1 ? 1 : move;
  let base = 0; for (let k = 0; k < i; k++) base += weights[k];
  return base + weights[i] * easeInOut(clamp(u / mv, 0, 1));
}

/**
 * Sizes of the n steps (sum to 1). Earlier steps are bigger (taper); `seed` jitters them
 * deterministically so ten gauges with different values don't move in lockstep. Exported for tests.
 */
export function stepWeights(n, seed, taper = DEFAULTS.stepTaper, jitter = DEFAULTS.stepJitter) {
  const raw = Array.from({ length: n }, (_, i) => {
    const j = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453; const r = j - Math.floor(j);
    return (1 + (n - 1 - i) * taper) * (1 - jitter / 2 + jitter * r);
  });
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map(w => w / sum);
}

const css = `
:host{--dg-size:120px;display:inline-block;width:var(--dg-size);height:var(--dg-size);position:relative;
  color:var(--dg-icon,#fff)}
svg.disc{display:block;width:100%;height:100%}
.track{fill:var(--dg-track,rgba(255,255,255,.08))}
.back{fill:var(--dg-wave,color-mix(in srgb,var(--dg-color,#4561de) 25%,#fff))}
.front{fill:var(--dg-color,#4561de)}
.overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
::slotted([slot=icon]){width:34%;height:34%;color:inherit}
`;

// In Node (tests) there is no DOM; export the pure helpers only.
const Base = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;

class DimensionGauge extends Base {
  static observedAttributes = ['value', 'label', 'static', 'max-fill', 'energy', 'fill-duration', 'delay', 'steps'];
  static defaults = DEFAULTS;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${css}</style>
      <svg class="disc" viewBox="0 0 100 100" aria-hidden="true">
        <defs><clipPath id="c"><circle cx="50" cy="50" r="${R}"/></clipPath></defs>
        <circle class="track" part="track" cx="50" cy="50" r="${R}"/>
        <g clip-path="url(#c)"><path class="back" part="back"/><path class="front" part="front"/></g>
      </svg>
      <div class="overlay"><slot name="icon"></slot></div>`;
    this._back = root.querySelector('.back');
    this._front = root.querySelector('.front');
    this._shown = 0;            // level currently drawn (0–100), animated
    this._from = 0; this._to = 0;
    this._t0 = 0;               // performance.now() when the current tween starts (may be in the future: delay)
    this._D = 0;                // current tween length, ms (0 = jump)
    this._weights = null;       // step sizes for the first fill, or null for a single smooth tween
    this._first = false;        // true while the first fill is running (for fillend)
    this._rise = 0;             // 0–1, how much the waves are swelling right now
    this._started = false;      // the first fill waits until the gauge is on screen
    this._raf = 0; this._t = 0; this._last = 0;
  }

  connectedCallback() {
    this.setAttribute('role', 'meter');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', '100');
    this._sync();
    this._reset();
    this._io = new IntersectionObserver(([e]) => {
      this._visible = e.isIntersecting;
      if (this._visible && !this._started) this._start();
      this._kick();
    });
    this._io.observe(this);
  }

  disconnectedCallback() { cancelAnimationFrame(this._raf); this._raf = 0; this._io?.disconnect(); }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    this._sync();
    if (name === 'value' || name === 'max-fill') {
      if (!this._started) return;               // the first fill picks up the latest value when it starts
      this._from = this._shown; this._to = this._value(); this._t0 = performance.now();
      this._D = this._still() ? 0 : Math.min(this._cfg('fillDuration', 'fill-duration', 0, 30000), DEFAULTS.updateDuration);
      this._weights = null; this._first = false;
    }
    this._kick();
  }

  get value() { return this._value(); }
  set value(v) { this.setAttribute('value', String(v)); }

  /** Empty the circle and run the first fill again (starts when the gauge is on screen). */
  replay() {
    this._reset();
    if (this._visible) this._start();
    this._kick();
  }

  // --- config ------------------------------------------------------------------------------
  // Attribute wins, then DimensionGauge.defaults. Clamped to a sane range.
  _cfg(key, attr, lo, hi) {
    const n = parseFloat(this.getAttribute(attr));
    return clamp(Number.isNaN(n) ? DEFAULTS[key] : n, lo, hi);
  }
  _ceiling() { return this._cfg('maxFill', 'max-fill', 0, 100); }
  _energy() { return this._cfg('energy', 'energy', 0.4, 1.6); }
  _value() { return Math.min(this._ceiling(), clamp(parseFloat(this.getAttribute('value')) || 0, 0, 100)); }
  _still() { return this.hasAttribute('static') || reduced(); }

  _sync() {
    const v = Math.round(clamp(parseFloat(this.getAttribute('value')) || 0, 0, 100));
    this.setAttribute('aria-valuenow', String(v));
    this.setAttribute('aria-valuetext', `${v}%`);
    const label = this.getAttribute('label');
    if (label) this.setAttribute('aria-label', label);
  }

  // --- first fill --------------------------------------------------------------------------
  _reset() {
    this._started = false; this._first = false;
    this._shown = this._from = 0; this._to = this._value();
    this._rise = 0;
    this._draw();
  }

  _start() {
    this._started = true; this._first = true;
    this._from = 0; this._to = this._value();
    const still = this._still();
    this._D = still ? 0 : this._cfg('fillDuration', 'fill-duration', 0, 30000);
    const n = Math.round(this._cfg('steps', 'steps', 1, 12));
    this._weights = n > 1 && !still
      ? stepWeights(n, this._to, DEFAULTS.stepTaper, DEFAULTS.stepJitter) : null;
    this._t0 = performance.now() + (still ? 0 : this._cfg('delay', 'delay', 0, 30000));   // no stagger when not animating
    this._emit('fillstart');
  }

  _emit(type) {
    this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail: { value: this._to } }));
  }

  // --- animation loop ----------------------------------------------------------------------
  _kick() { if (!this._raf && this._visible !== false) this._raf = requestAnimationFrame(n => this._frame(n)); }

  _frame(now) {
    this._raf = 0;
    const dt = this._last ? Math.min(0.05, (now - this._last) / 1000) : 0;
    this._last = now;
    if (!this._still()) this._t += dt * this._energy();          // wave clock

    const p = this._D ? clamp((now - this._t0) / this._D, 0, 1) : (now >= this._t0 ? 1 : 0);
    const f = this._weights
      ? stepped(p, this._weights, DEFAULTS.stepMove)
      : 1 - Math.pow(1 - p, DEFAULTS.updateEasePower);
    const prev = this._shown;
    this._shown = this._from + (this._to - this._from) * f;

    // Waves swell a little while the level moves and calm during the pauses; eased so it never pops.
    const moving = p > 0 && p < 1 && Math.abs(this._shown - prev) > 0.004 ? 1 : 0;
    this._rise += (moving - this._rise) * Math.min(1, dt * 3);
    this._draw();

    if (p >= 1 && this._first) { this._first = false; this._emit('fillend'); }

    // Keep looping while waves move, the level is tweening, or a delayed start is pending.
    if (!this._still() || p < 1 || now < this._t0) this._kick(); else this._last = 0;
  }

  // --- drawing -----------------------------------------------------------------------------
  _draw() {
    const { back, front } = DEFAULTS.waves;
    this._back.setAttribute('d', this._wave(this._shown, back));
    this._front.setAttribute('d', this._wave(this._shown, front));
  }

  _wave(v, w) {
    // Waves flatten near 0 and 100 so the circle reads as truly empty / truly full.
    const edge = clamp(Math.min(1, v / DEFAULTS.flattenBelow, (100 - v) / DEFAULTS.flattenBelow), 0, 1);
    const amp = w.amp * edge * (0.55 + 0.45 * this._energy()) * (1 + DEFAULTS.swell * this._rise);
    const y0 = v >= 99.5 ? -w.amp - 1 : (100 - v) - w.lift * edge;   // surface y; 0 is the top
    let d = `M-2 102 L-2 ${y0.toFixed(2)}`;
    const N = DEFAULTS.points;
    for (let i = 0; i <= N; i++) {
      const x = -2 + (104 * i) / N;
      const y = y0 + amp * Math.sin((x / 100) * Math.PI * 2 * w.k + this._t * w.speed + w.phase);
      d += ` L${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return d + ' L102 102 Z';
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('dimension-gauge')) {
  customElements.define('dimension-gauge', DimensionGauge);
}
export { DimensionGauge, DEFAULTS };
