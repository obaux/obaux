/**
 * Likert responses -> 0–100 score -> weak / steady / strong bucket -> <dimension-gauge> props.
 * Pure functions, no dependencies, no DOM.
 *
 *   import { scoreDimension, gaugeProps } from './likert.js';
 *   const r = scoreDimension([4, 5, 2], { min: 1, max: 5, reverse: [2] });
 *   // r = { score: 75, bucket: 'strong', answered: 3, total: 3 }
 *   gaugeProps(r) // { value: 75, energy: 1.35 }  (null score -> value 0, energy 0.6)
 *
 * Placeholder decisions to confirm with the product owner are marked TODO(product).
 */

// TODO(product): scale endpoints. 1–5 here; set to 1–7 etc. if the survey differs.
export const DEFAULT_SCALE = { min: 1, max: 5 };

// TODO(product): bucket cut points on the 0–100 score. On a 1–5 scale: <40 is a mean under 2.6,
// >=70 is a mean of 3.8 or higher. Weak is score < weakBelow, strong is score >= strongFrom.
export const DEFAULT_CUTS = { weakBelow: 40, strongFrom: 70 };

// Wave energy per bucket, matching the weak / steady / strong examples.
export const BUCKET_ENERGY = { weak: 0.6, steady: 1, strong: 1.35 };

/**
 * @param {Array<number|null|undefined>} responses one entry per question, in order.
 *        null / undefined / NaN / out-of-range = unanswered and ignored.
 * @param {{min?:number,max?:number,reverse?:number[],weakBelow?:number,strongFrom?:number}} [opts]
 *        reverse = indexes of negatively worded items (5 becomes 1, 4 becomes 2 ...).
 * @returns {{score:number|null,bucket:'weak'|'steady'|'strong'|null,answered:number,total:number}}
 *          score is null (and bucket null) when nothing was answered.
 */
export function scoreDimension(responses, opts = {}) {
  const { min, max } = { ...DEFAULT_SCALE, ...opts };
  const { weakBelow, strongFrom } = { ...DEFAULT_CUTS, ...opts };
  const reverse = new Set(opts.reverse || []);
  const vals = [];
  responses.forEach((r, i) => {
    const n = typeof r === 'number' ? r : NaN;
    if (!Number.isFinite(n) || n < min || n > max) return;
    vals.push(reverse.has(i) ? min + max - n : n);
  });
  const total = responses.length;
  if (!vals.length) return { score: null, bucket: null, answered: 0, total };
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const score = Math.round(((mean - min) / (max - min)) * 100);
  const bucket = score < weakBelow ? 'weak' : score >= strongFrom ? 'strong' : 'steady';
  return { score, bucket, answered: vals.length, total };
}

/** Props for <dimension-gauge>. The gauge itself caps the fill at 92 (see max-fill). */
export function gaugeProps({ score, bucket }) {
  return { value: score ?? 0, energy: BUCKET_ENERGY[bucket] ?? BUCKET_ENERGY.weak };
}
