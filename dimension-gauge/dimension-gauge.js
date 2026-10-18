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
const easeOut = t => 1 - Math.pow(1 - t, 3);

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
  static observedAttributes = ['value', 'label', 'static'];

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
    this._from = 0; this._to = 0; this._t0 = 0;
    this._raf = 0; this._t = 0;
  }

  connectedCallback() {
    this.setAttribute('role', 'meter');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', '100');
    this._sync();
    this._to = this._value();
    this._shown = this._from = 0;   // always fill up from empty on first paint
    this._t0 = performance.now();
    this._io = new IntersectionObserver(([e]) => { this._visible = e.isIntersecting; this._kick(); });
    this._io.observe(this);
    this._visible = true;
    this._kick();
  }

  disconnectedCallback() { cancelAnimationFrame(this._raf); this._raf = 0; this._io?.disconnect(); }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'value') {
      this._from = this._shown; this._to = this._value(); this._t0 = performance.now();
      this._sync(); this._kick();
    } else { this._sync(); this._kick(); }
  }

  get value() { return this._value(); }
  set value(v) { this.setAttribute('value', String(v)); }

  _value() { return clamp(parseFloat(this.getAttribute('value')) || 0, 0, 100); }
  _still() { return this.hasAttribute('static') || REDUCED(); }

  _sync() {
    const v = Math.round(this._value());
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
    if (!this._still()) this._t += dt;

    const D = 900;                                   // level tween, ms
    const p = clamp((now - this._t0) / D, 0, 1);
    this._shown = this._from + (this._to - this._from) * easeOut(p);
    this._draw();

    // Keep looping while the waves move or the level is still tweening.
    if (!this._still() || p < 1) this._kick(); else this._last = 0;
  }

  _draw() {
    const v = this._shown;
    this._back.setAttribute('d', this._wave(v, BACK));
    this._front.setAttribute('d', this._wave(v, FRONT));
  }

  _wave(v, w) {
    // Waves flatten near 0 and 100 so the circle reads as truly empty / truly full.
    const edge = Math.min(1, v / 6, (100 - v) / 6);
    const amp = w.amp * clamp(edge, 0, 1);
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
