/**
 * <dimension-gauge> — flat "liquid fill" circle for showing one life dimension's amount.
 *
 *   <dimension-gauge value="72" label="Housing">
 *     <svg slot="icon">…</svg>
 *   </dimension-gauge>
 *
 * Attributes
 *   value       0–100. Changing it animates the level to the new value.
 *   label       Accessible name (e.g. "Housing"). Required for screen readers.
 *   max-fill    Highest level the circle can reach, 0–100. Default 92, so there is always
 *               a little room left at the top. Use max-fill="100" to allow a full circle.
 *   energy      Wave liveliness, 0.4–1.6. Default 1. Low = slow, shallow swell; high = brisk, taller waves.
 *   fill-duration  ms for the first fill from empty. Default 3600: a slow rise, like water filling a sphere.
 *                  Later changes to `value` use a shorter tween (max 1400 ms).
 *   delay       ms to wait before the first fill starts. Stagger a row of gauges with delay="${i*180}".
 *   static      Boolean. No wave motion (also automatic under prefers-reduced-motion).
 *
 * Theming (CSS custom properties, set on the element or any ancestor)
 *   --dg-size   Diameter. Default 120px.
 *   --dg-color  The one brand color. Front wave / body. Default #4561de
 *   --dg-wave   Optional override for the pale back wave. Default: --dg-color mixed 75% with white
 *   --dg-track  Empty circle.        Default translucent white
 *   --dg-icon   Icon color.          Default #fff
 *
 * No dependencies. One file. Works in any framework as a plain custom element.
 */
const NS = 'http://www.w3.org/2000/svg';
const R = 50;              // viewBox is 100x100, circle radius 50
const STEPS = 48;          // points per wave path
const REDUCED = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
// Water-fill feel: starts steadily, then slows gently as it nears the level.
const easeFill = t => 1 - Math.pow(1 - t, 2.2);

// Wave layers: [amplitude, wavelengths across the circle, speed rad/s, phase offset, level offset]
// The back (pale) layer sits slightly higher and moves against the front so it peeks out as a sliver.
const BACK  = { amp: 4.2, k: 1.15, speed: -1.7, phase: 1.3, lift: 2.2 };
const FRONT = { amp: 3.6, k: 1.0,  speed:  1.4, phase: 0,   lift: 0 };

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

class DimensionGauge extends HTMLElement {
  static observedAttributes = ['value', 'label', 'static', 'max-fill', 'energy', 'fill-duration', 'delay'];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${css}</style>
      <svg class="disc" viewBox="0 0 100 100" aria-hidden="true">
        <defs><clipPath id="c"><circle cx="50" cy="50" r="${R}"/></clipPath></defs>
        <circle class="track" cx="50" cy="50" r="${R}"/>
        <g clip-path="url(#c)"><path class="back"/><path class="front"/></g>
      </svg>
      <div class="overlay"><slot name="icon"></slot></div>`;
    this._back = root.querySelector('.back');
    this._front = root.querySelector('.front');
    this._shown = 0;          // value currently drawn (animated)
    this._from = 0; this._to = 0; this._t0 = 0; this._D = 0;
    this._started = false;    // first fill waits until the gauge is on screen
    this._raf = 0; this._t = 0;
  }

  connectedCallback() {
    this.setAttribute('role', 'meter');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', '100');
    this._sync();
    this._to = this._value();
    this._shown = this._from = 0;   // always fill up from empty on first paint
    this._visible = false;          // nothing animates until the gauge is on screen
    this._draw();
    this._io = new IntersectionObserver(([e]) => {
      this._visible = e.isIntersecting;
      if (this._visible && !this._started) this._start();
      this._kick();
    });
    this._io.observe(this);
  }

  _start() {
    this._started = true;
    this._from = 0; this._to = this._value();
    this._D = this._still() ? 0 : this._num('fill-duration', 3600, 0, 20000);
    this._t0 = performance.now() + this._num('delay', 0, 0, 20000);
  }

  _num(name, dflt, lo, hi) { const n = parseFloat(this.getAttribute(name)); return clamp(Number.isNaN(n) ? dflt : n, lo, hi); }

  disconnectedCallback() { cancelAnimationFrame(this._raf); this._raf = 0; this._io?.disconnect(); }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'value' || name === 'max-fill') {
      this._sync();
      if (!this._started) return;                     // first fill picks up the latest value when it starts
      this._from = this._shown; this._to = this._value(); this._t0 = performance.now();
      this._D = this._still() ? 0 : Math.min(this._num('fill-duration', 3600, 0, 20000), 1400);
      this._kick();
    } else { this._sync(); this._kick(); }
  }

  get value() { return this._value(); }
  set value(v) { this.setAttribute('value', String(v)); }

  _ceiling() { const m = parseFloat(this.getAttribute('max-fill')); return clamp(Number.isNaN(m) ? 92 : m, 0, 100); }
  _energy() { const e = parseFloat(this.getAttribute('energy')); return clamp(Number.isNaN(e) ? 1 : e, 0.4, 1.6); }
  _value() { return Math.min(this._ceiling(), clamp(parseFloat(this.getAttribute('value')) || 0, 0, 100)); }
  _still() { return this.hasAttribute('static') || REDUCED(); }

  _sync() {
    const v = Math.round(clamp(parseFloat(this.getAttribute('value')) || 0, 0, 100));
    this.setAttribute('aria-valuenow', String(v));
    this.setAttribute('aria-valuetext', `${v}%`);
    const label = this.getAttribute('label');
    if (label) this.setAttribute('aria-label', label);
  }

  _kick() { if (!this._raf && this._visible !== false) this._raf = requestAnimationFrame(n => this._frame(n)); }

  _frame(now) {
    this._raf = 0;
    const dt = this._last ? Math.min(0.05, (now - this._last) / 1000) : 0;
    this._last = now;
    if (!this._still()) this._t += dt * this._energy();

    const p = this._D ? clamp((now - this._t0) / this._D, 0, 1) : (now >= this._t0 ? 1 : 0);
    this._shown = this._from + (this._to - this._from) * easeFill(p);
    this._rise = p > 0 && p < 1 ? 1 - p : 0;         // waves swell a little while the level is rising
    this._draw();

    // Keep looping while the waves move or the level is still tweening.
    if (!this._still() || p < 1 || now < this._t0) this._kick(); else this._last = 0;
  }

  _draw() {
    const v = this._shown;
    this._back.setAttribute('d', this._wave(v, BACK));
    this._front.setAttribute('d', this._wave(v, FRONT));
  }

  _wave(v, w) {
    // Waves flatten near 0 and 100 so the circle reads as truly empty / truly full.
    const edge = Math.min(1, v / 6, (100 - v) / 6);
    const amp = w.amp * clamp(edge, 0, 1) * (0.55 + 0.45 * this._energy()) * (1 + 0.3 * (this._rise || 0));
    const level = 100 - v;                            // y of the surface (0 = top)
    const y0 = v >= 99.5 ? -w.amp - 1 : level - w.lift * clamp(edge, 0, 1);
    let d = `M-2 102 L-2 ${y0.toFixed(2)}`;
    for (let i = 0; i <= STEPS; i++) {
      const x = -2 + (104 * i) / STEPS;
      const y = y0 + amp * Math.sin((x / 100) * Math.PI * 2 * w.k + this._t * w.speed + w.phase);
      d += ` L${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return d + ' L102 102 Z';
  }
}

if (!customElements.get('dimension-gauge')) customElements.define('dimension-gauge', DimensionGauge);
export { DimensionGauge };
