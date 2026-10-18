#!/usr/bin/env node
// "Did my change alter the animation?" Records every circle's position and size at 66 instants
// (entrance and exit), then compares a later run against it. Use it before and after a refactor
// that should not change how anything looks: the difference should be exactly 0.
//
//   node tools/regress.cjs --save  before.json
//   ...edit index.html...
//   node tools/regress.cjs --compare before.json     (exit code 1 if anything differs)
const fs = require('fs');
const { launch, open, arg } = require('./lib.cjs');

(async () => {
  const browser = await launch();
  const page = await open(browser);
  const run = await page.evaluate(() => {
    const h = window.hero; h.reduceMotion = false;
    const times = [...Array(61).keys()].map(i => [i * 0.05, null]).concat([[3, 0], [3, 0.15], [3, 0.4], [3, 0.8], [3, 1.2]]);
    const frames = times.map(([t, x]) => {
      h.seek(t, x); h._frame(t * 1000);
      return { t, x, n: h.orbs.length, d: Array.from(h.data.subarray(0, (h.orbs.length + 1) * 8)) };
    });
    return { W: h.W, H: h.H, frames };
  });
  await browser.close();

  const save = arg('save'), cmp = arg('compare');
  if (save) { fs.writeFileSync(save, JSON.stringify(run)); console.log(`saved ${run.frames.length} frames to ${save}`); return; }
  if (!cmp) { console.log('pass --save <file> or --compare <file>'); process.exit(2); }
  const base = JSON.parse(fs.readFileSync(cmp, 'utf8'));
  if (base.W !== run.W || base.H !== run.H || base.frames.length !== run.frames.length) { console.log('different canvas size or frame count; cannot compare'); process.exit(1); }
  let max = 0, at = null, n = 0;
  base.frames.forEach((f, i) => {
    const g = run.frames[i];
    if (f.n !== g.n) { max = Infinity; at = `t=${f.t}: ${f.n} vs ${g.n} circles`; return; }
    f.d.forEach((v, k) => { n++; const d = Math.abs(v - g.d[k]); if (d > max) { max = d; at = `t=${f.t}${f.x != null ? ' exit ' + f.x : ''} value ${k}: ${v} vs ${g.d[k]}`; } });
  });
  console.log(`${n} values compared, max difference ${max}${max ? '  (worst at ' + at + ')' : ''}`);
  process.exit(max === 0 ? 0 : 1);
})();
