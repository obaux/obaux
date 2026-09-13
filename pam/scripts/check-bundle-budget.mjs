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
 * One exception, and it is a correction rather than a loophole: Next marks its
 * legacy polyfill chunk `noModule`, so every browser that supports ES modules —
 * which is every browser that can run this app at all, since the design system
 * needs `light-dark()` and container queries — skips the download entirely. It
 * was being counted anyway, and at 38 kB gzipped that is nearly 8% of the
 * budget spent on bytes no member has ever received. The budget is about what a
 * phone downloads; this now measures that.
 */
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'apps/web/out');
const BUDGET_KB = 500;

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
console.log(`\nBudget (§12): ${BUDGET_KB} kB gzipped`);

if (totalGzipKb > BUDGET_KB) {
  console.error(
    `\nOver budget by ${(totalGzipKb - BUDGET_KB).toFixed(1)} kB. ` +
      'Code-split or drop the largest entry above.',
  );
  process.exit(1);
}

console.log(`Within budget, ${(BUDGET_KB - totalGzipKb).toFixed(1)} kB to spare.`);
