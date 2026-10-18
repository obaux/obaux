// Run: node dimension-gauge.test.mjs   (pure motion math; the element itself needs a browser)
import assert from 'node:assert/strict';
import { stepped, stepWeights, DEFAULTS } from './dimension-gauge.js';

const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} !~ ${b}`);

// Step sizes sum to 1, are all positive, and are deterministic per seed.
for (const n of [1, 2, 5, 12]) {
  const w = stepWeights(n, 78);
  near(w.reduce((a, b) => a + b, 0), 1);
  assert.ok(w.every(x => x > 0));
  assert.deepEqual(w, stepWeights(n, 78));
}
// Different gauges (seeds) get different step sizes, so ten gauges don't move in lockstep.
assert.notDeepEqual(stepWeights(5, 31), stepWeights(5, 78));
// With no jitter, taper makes each step smaller than the one before; taper 0 makes them equal.
const t = stepWeights(5, 1, 0.55, 0);
for (let i = 1; i < t.length; i++) assert.ok(t[i] < t[i - 1]);
stepWeights(5, 1, 0, 0).forEach(x => near(x, 0.2));

// The curve starts at 0, ends at 1, and never goes backwards.
const w = stepWeights(5, 78);
near(stepped(0, w), 0); near(stepped(1, w), 1);
let prev = -1;
for (let i = 0; i <= 1000; i++) { const v = stepped(i / 1000, w); assert.ok(v >= prev - 1e-12); prev = v; }

// Each step ends in a hold: late in a slice the level equals the running total, so it plateaus.
const move = DEFAULTS.stepMove;
let total = 0;
for (let i = 0; i < 4; i++) {
  total += w[i];
  near(stepped((i + 0.99) / 5, w), total);                  // inside the hold
  near(stepped((i + move + 0.01) / 5, w), total);           // just after the rise ends
}
// move = 1 removes the pauses: the level keeps changing through the whole slice.
assert.ok(stepped(0.19, w, 1) < stepped(0.2, w, 1));
// One step is a single smooth ease in-out from 0 to 1.
near(stepped(0.5, [1]), 0.5); near(stepped(0, [1]), 0); near(stepped(1, [1]), 1);
console.log('gauge motion ok');
