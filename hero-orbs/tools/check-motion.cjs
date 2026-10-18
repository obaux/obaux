#!/usr/bin/env node
// Is the motion smooth? Steps the animation at 60fps and reports:
//   1. how far each spring overshoots (and that it settles to exactly 1)
//   2. the biggest frame-to-frame jumps in speed ("acceleration spikes"). A true jump (a circle
//      snapping, a motion switching on at full strength) shows up as a spike far above its
//      neighbours; smooth curves stay low. The entrance's long outer-circle travel is ~3.
//   3. the same for the idle float after landing (should be well under 0.1)
//   4. a synthetic touch: press next to a circle, release, print its offset as it springs back
//
//   node tools/check-motion.cjs [--config '{"spring":{"size":{"zeta":0.5}}}']
const { launch, open, arg } = require('./lib.cjs');

(async () => {
  const browser = await launch();
  const page = await open(browser);
  const cfg = arg('config');
  if (cfg) await page.evaluate(c => hero.configure(JSON.parse(c)), cfg);

  const r = await page.evaluate(() => {
    const h = window.hero; h.reduceMotion = false;
    const out = { springs: {}, frames: [], touch: [] };
    for (const k of ['pos', 'size', 'hero']) {
      const tb = h.tabs[k]; let peak = 0; tb.forEach(v => { if (v > peak) peak = v; });
      out.springs[k] = { peak: +peak.toFixed(3), final: +tb[tb.length - 1].toFixed(4) };
    }
    out.settleAt = h.settleAt;
    for (let i = 0; i <= 240; i++) {                       // 0 to 4s
      const t = i / 60; h.seek(t);
      const log = []; const D = h.data; const orig = D.set.bind(D);
      D.set = (a, o) => { log.push([a[0], a[1], a[2]]); return orig(a, o); };
      h._frame(t * 1000); delete D.set;
      out.frames.push({ t, log });
    }
    // touch: unfrozen, pointer presses just left of a middle-row circle at 3s, releases at 3.67s
    h.frozen = null; h.t0 = 0; h.lastNow = 3000;
    const orb = h.orbs.find(o => o.x > 0.1 && Math.abs(o.y) < 0.01 && !o.empty);
    const cx = h.config.layout.center[0], cy = h.config.layout.center[1] * h.H / h.W;
    const home = { x: cx + orb.x, y: cy + orb.y };
    for (let i = 0; i < 150; i++) {
      if (i === 5)  Object.assign(h.pointer, { x: home.x - 0.05, y: home.y, active: true, down: true, tap: true });
      if (i === 40) Object.assign(h.pointer, { active: false, down: false });
      h._frame(3000 + i * 1000 / 60);
      if (i % 5 === 0) out.touch.push([i, +(orb.st.ox * 402).toFixed(1)]);
    }
    return out;
  });

  console.log('Springs (peak = overshoot, final should be 1):');
  for (const [k, v] of Object.entries(r.springs)) console.log(`  ${k.padEnd(5)} peak ${v.peak}  (+${((v.peak - 1) * 100).toFixed(1)}%)  final ${v.final}`);

  const spikes = [];
  for (let i = 2; i < r.frames.length; i++) {
    const a = r.frames[i - 2].log, b = r.frames[i - 1].log, c = r.frames[i].log;
    if (a.length !== b.length || b.length !== c.length) continue;   // a circle just appeared; skip
    for (let k = 0; k < c.length; k++) for (const [ch, nm] of [[0, 'x'], [1, 'y'], [2, 'r']]) {
      spikes.push({ t: r.frames[i].t, k: k === c.length - 1 ? 'hero' : k, nm, acc: Math.abs((c[k][ch] - b[k][ch]) - (b[k][ch] - a[k][ch])) });
    }
  }
  const top = (list, n) => list.sort((x, y) => y.acc - x.acc).slice(0, n).map(s => `t=${s.t.toFixed(2)} circle ${s.k} ${s.nm} ${s.acc.toFixed(2)}`);
  const entrance = spikes.filter(s => s.t < r.settleAt), idle = spikes.filter(s => s.t >= r.settleAt + 0.2);
  console.log('\nLargest change-of-speed, device px/frame^2 (smooth = no lone spike):');
  console.log('  entrance:', top(entrance, 3).join(' | '));
  console.log('  idle    :', top(idle, 3).join(' | '));
  console.log('\nTouch: offset in css px of a circle (press at frame 5, release at frame 40):');
  console.log('  ' + r.touch.map(x => x.join(':')).join('  '));
  await browser.close();
})();
