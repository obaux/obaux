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

const scripts = [...new Set([...html.matchAll(/\/_next\/static\/[^"']+?\.js/g)].map((m) => m[0]))];

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
