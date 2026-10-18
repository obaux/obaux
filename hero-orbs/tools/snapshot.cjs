#!/usr/bin/env node
// Writes a PNG of the banner at chosen instants, to look at the motion without a device.
//   node tools/snapshot.cjs <out dir> [--times 0.2,0.8,1.2,3] [--config '{...}'] [--exit 0.5]
// --exit freezes the exit animation at that many seconds into exit() (and draws at the last time).
const fs = require('fs'), path = require('path');
const { launch, open, arg } = require('./lib.cjs');

(async () => {
  const dir = process.argv[2];
  if (!dir || dir.startsWith('--')) { console.log('usage: snapshot.cjs <out dir> [--times a,b,c] [--config json] [--exit s]'); process.exit(2); }
  fs.mkdirSync(dir, { recursive: true });
  const times = (arg('times', '0.2,0.5,0.8,1.0,1.2,1.5,3')).split(',').map(Number);
  const browser = await launch();
  const page = await open(browser, { height: 400 });
  const cfg = arg('config'); if (cfg) await page.evaluate(c => hero.configure(JSON.parse(c)), cfg);
  const ex = arg('exit');
  for (const t of times) {
    await page.evaluate(([t, ex]) => { hero.reduceMotion = false; hero.seek(t, ex === null ? null : +ex); hero._frame(t * 1000); }, [t, ex ?? null]);
    const box = await (await page.$('#hero')).boundingBox();
    const file = path.join(dir, `t_${String(t).replace('.', '_')}.png`);
    await page.screenshot({ path: file, clip: box });
    console.log(file);
  }
  await browser.close();
})();
