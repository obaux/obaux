// Accessibility check of the built public site (apps/site/out): axe-core against
// every page, light and dark, desktop and a 390px phone, plus Support with a
// search typed in. pam-site is not covered by the app's Playwright suite
// (apps/web/e2e), so this is its check.
//
//   pnpm --filter @pam/site build && node apps/site/scripts/a11y.mjs   (from pam/)
//
// Needs Playwright's Chromium (or CHROMIUM_PATH). Exits 1 on any violation.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'out');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const server = createServer((req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (path.endsWith('/')) path += 'index.html';
  try {
    const body = readFileSync(join(out, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

// Every page the build made: Home, Support, and each published post (drafts are not built).
const posts = readdirSync(join(out, 'support'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(out, 'support', d.name, 'index.html')))
  .map((d) => `/support/${d.name}/`);
// Every language page that was built (a preview build: PAM_SITE_DRAFTS=1).
const about = readdirSync(out, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => ['about-pam', 'program-rules'].filter((p) => existsSync(join(out, d.name, p, 'index.html'))).map((p) => `/${d.name}/${p}/`));
const pages = ['/', '/support/', ...posts, ...about];
const views = [
  { name: 'desktop light', viewport: { width: 1280, height: 900 }, colorScheme: 'light' },
  { name: 'desktop dark', viewport: { width: 1280, height: 900 }, colorScheme: 'dark' },
  { name: 'phone light', viewport: { width: 390, height: 844 }, colorScheme: 'light' },
  { name: 'phone dark', viewport: { width: 390, height: 844 }, colorScheme: 'dark' },
  // The narrowest phone still in use. The language-fit audit measured the header here
  // in Storybook and let an overlap through; this looks at the built site.
  { name: 'small phone light', viewport: { width: 320, height: 640 }, colorScheme: 'light' },
];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let failures = 0;
let checks = 0;
async function scan(page, label) {
  await page.evaluate(axeSource);
  const { violations } = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } }));
  checks += 1;
  if (violations.length) {
    failures += violations.length;
    for (const v of violations) console.log(`FAIL ${label}: ${v.id} (${v.impact}) — ${v.help} [${v.nodes.length}] e.g. ${v.nodes[0].target.join(' ')}`);
  } else console.log(`ok   ${label}`);
}
for (const view of views) {
  const ctx = await browser.newContext({ viewport: view.viewport, colorScheme: view.colorScheme });
  const page = await ctx.newPage();
  for (const path of pages) {
    await page.goto(base + path);
    await page.waitForTimeout(600);
    await scan(page, `${view.name} ${path}`);
    // No sideways scroll on a phone: a page that needs it fails a reader with a magnifier.
    // Header controls must not sit on top of each other.
    const overlap = await page.evaluate(() => {
      const items = [...document.querySelectorAll('nav a, nav button')].filter((e) => e.getClientRects().length);
      const rects = items.map((e) => [e.textContent?.trim(), e.getBoundingClientRect()]);
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const [a, ra] = rects[i], [b, rb] = rects[j];
        if (ra.left < rb.right - 1 && rb.left < ra.right - 1 && ra.top < rb.bottom - 1 && rb.top < ra.bottom - 1) return `${a} / ${b}`;
      }
      return '';
    });
    if (overlap) {
      failures += 1;
      console.log(`FAIL ${view.name} ${path}: header controls overlap (${overlap})`);
    }
    if (view.viewport.width < 500 && (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))) {
      failures += 1;
      console.log(`FAIL ${view.name} ${path}: horizontal scroll`);
    }
  }
  await page.goto(base + '/support/');
  await page.getByRole('textbox', { name: 'Search Support' }).fill('reason');
  await page.waitForTimeout(300);
  await scan(page, `${view.name} /support/ searching`);
  await ctx.close();
}
await browser.close();
server.close();
console.log(`\n${checks} scans, ${failures} problem(s)`);
process.exit(failures ? 1 : 0);
