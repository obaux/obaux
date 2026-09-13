/**
 * Enforces the §12 performance budget: "Web first load under 500 KB JS."
 *
 * A member on a prepaid plan pays for every kilobyte and waits on a throttled
 * 3G connection for it, so this is a product requirement rather than an
 * optimisation target — hence a failing build instead of a warning nobody reads.
 *
 * What is measured: exactly the scripts the exported entry page references,
 * gzipped, because that is what actually crosses the network on a first visit.
 * Summing every chunk in the output directory would count code that only loads
 * on other routes and would fail the build for the wrong reason.
 *
 * Animation is budgeted separately (Will, 13 September). The motion features
 * are a dynamic import that the app fetches only when the connection can carry
 * them — Data Saver off, better than 2G — so they are not part of what a member
 * on a bad connection downloads to use PAM, and counting them against the
 * first-load budget would price a member's first screen at the cost of an
 * easing curve they may never receive. The chunk is measured and printed
 * against its own ceiling, because "not in this budget" must not mean
 * "unmeasured": it is the line that stops animation growing without anybody
 * noticing.
 *
 * One more exception, and it is a correction rather than a loophole: Next marks its
 * legacy polyfill chunk `noModule`, so every browser that supports ES modules —
 * which is every browser that can run this app at all, since the design system
 * needs `light-dark()` and container queries — skips the download entirely. It
 * was being counted anyway, and at 38 kB gzipped that is nearly 8% of the
 * budget spent on bytes no member has ever received. The budget is about what a
 * phone downloads; this now measures that.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'apps/web/out');
const BUDGET_KB = 500;
/**
 * §12 covers the app. This is animation's own ceiling — see the note above.
 *
 * 40 kB is today's 37.3 plus a little room. It is not a target anybody should
 * spend: its job is to make growth visible, so that the day somebody imports
 * the full `motion` component or adds layout projection, the build says so
 * instead of a deferred chunk quietly doubling.
 */
const MOTION_BUDGET_KB = 40;

let html;
try {
  html = readFileSync(join(outDir, 'index.html'), 'utf8');
} catch {
  console.error(`No export at ${outDir}/index.html. Run the web build first.`);
  process.exit(1);
}

/**
 * Every script tag, with whether the browser will actually fetch it. A
 * `noModule` script is downloaded only by browsers with no ES module support,
 * and PAM does not run in one.
 */
const tags = [...html.matchAll(/<script[^>]*src="(\/_next\/static\/[^"']+?\.js)"[^>]*>/g)];
const legacyOnly = new Set(
  tags.filter((t) => /\bnoModule\b/i.test(t[0])).map((t) => t[1]),
);
const scripts = [...new Set(tags.map((t) => t[1]))].filter((src) => !legacyOnly.has(src));

if (legacyOnly.size > 0) {
  console.log(
    `Not counted (noModule — modern browsers do not fetch it): ${[...legacyOnly]
      .map((s) => s.replace('/_next/static/chunks/', ''))
      .join(', ')}\n`,
  );
}

if (scripts.length === 0) {
  console.error('Found no scripts in the exported HTML — the budget check would pass vacuously.');
  process.exit(1);
}

const rows = scripts
  .map((src) => {
    const path = join(outDir, src.replace(/^\//, ''));
    const buf = readFileSync(path);
    return { src, raw: statSync(path).size, gzip: gzipSync(buf, { level: 9 }).length };
  })
  .sort((a, b) => b.gzip - a.gzip);

/**
 * The animation chunks, wherever the bundler put them.
 *
 * Identified by content rather than by filename: chunk names are hashes and a
 * bundler is free to merge or split them, so this asks each file whether
 * framer-motion is inside it. If motion ever lands in a first-load chunk —
 * because somebody imported `motion` instead of `m`, or added it to a shared
 * boundary — it stops being separately budgeted and starts counting against
 * §12, which is exactly the alarm that should go off.
 */
/*
 * Matched on the library's own internals, which survive minification as class
 * and function names. Deliberately NOT on words like `whileTap`: PAM's own
 * components contain those, so the check would flag the app's chunk as an
 * animation chunk and measure the wrong thing. If this ever stops matching, the
 * check says "0 animation chunks" and silently guards nothing — so the build
 * also fails when it finds none at all.
 */
const MOTION_SIGNATURE = /VisualElementDragControls|animateVisualElement|htmlVisualElement|createRenderState/;
const motionChunks = [];
for (const file of readdirSync(join(outDir, '_next/static/chunks'), { recursive: true })) {
  if (typeof file !== 'string' || !file.endsWith('.js')) continue;
  const path = join(outDir, '_next/static/chunks', file);
  const buf = readFileSync(path);
  if (!MOTION_SIGNATURE.test(buf.toString('utf8'))) continue;
  motionChunks.push({
    src: `/_next/static/chunks/${file}`,
    raw: buf.length,
    gzip: gzipSync(buf, { level: 9 }).length,
  });
}

const motionInFirstLoad = motionChunks.filter((c) => scripts.includes(c.src));

if (motionChunks.length === 0) {
  console.error(
    '\nFound no animation chunk at all. Either framer-motion is gone (update this check) or its ' +
      'signature changed and this check is now measuring nothing.',
  );
  process.exit(1);
}
const motionGzipKb = motionChunks.reduce((sum, c) => sum + c.gzip, 0) / 1024;

const totalGzipKb = rows.reduce((sum, r) => sum + r.gzip, 0) / 1024;
const totalRawKb = rows.reduce((sum, r) => sum + r.raw, 0) / 1024;

console.log(`First-load JS for "/" — ${scripts.length} scripts\n`);
for (const r of rows) {
  console.log(
    `  ${(r.gzip / 1024).toFixed(1).padStart(7)} kB gz  ${(r.raw / 1024).toFixed(0).padStart(5)} kB raw  ${r.src.replace('/_next/static/chunks/', '')}`,
  );
}
console.log(
  `\n  ${totalGzipKb.toFixed(1).padStart(7)} kB gz  ${totalRawKb.toFixed(0).padStart(5)} kB raw  TOTAL`,
);
console.log(
  `\n  ${motionGzipKb.toFixed(1).padStart(7)} kB gz  ${motionChunks.length} animation chunk(s), loaded only on a connection that can carry them`,
);
console.log(`\nBudget (§12): ${BUDGET_KB} kB gzipped · animation: ${MOTION_BUDGET_KB} kB`);

if (motionInFirstLoad.length > 0) {
  console.error(
    `\nAnimation is in the first load (${motionInFirstLoad
      .map((c) => c.src.replace('/_next/static/chunks/', ''))
      .join(', ')}). It is budgeted separately because it is a deferred chunk; if it ships with the app it has to count against §12. Import \`m\`, never \`motion\`, and keep it behind LazyMotion.`,
  );
  process.exit(1);
}

if (motionGzipKb > MOTION_BUDGET_KB) {
  console.error(
    `\nAnimation is ${(motionGzipKb - MOTION_BUDGET_KB).toFixed(1)} kB over its own ${MOTION_BUDGET_KB} kB ceiling.`,
  );
  process.exit(1);
}

if (totalGzipKb > BUDGET_KB) {
  console.error(
    `\nOver budget by ${(totalGzipKb - BUDGET_KB).toFixed(1)} kB. ` +
      'Code-split or drop the largest entry above.',
  );
  process.exit(1);
}

console.log(`Within budget, ${(BUDGET_KB - totalGzipKb).toFixed(1)} kB to spare.`);
