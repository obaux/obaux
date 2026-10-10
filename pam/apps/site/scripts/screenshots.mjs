// Screenshots for the help posts, taken from Storybook at phone width.
//
//   pnpm --filter @pam/web build-storybook          (once; from pam/)
//   node apps/site/scripts/screenshots.mjs          (from pam/)
//
// Reads apps/site/screenshots.json: a list of { id, out, ... }. `id` is a Storybook
// story id (e.g. member-created--profile), `out` is a path under apps/site/public/help/.
// Every picture is of PRETEND people and places only — Storybook's fixtures — so no
// real name, phone number or email can be in one. Re-run it and commit the pictures
// when a screen changes. Needs Playwright's Chromium (or CHROMIUM_PATH).
//
// Optional per entry: `args` (Storybook controls, "name:value;name:value"), `globals`
// ("theme:dark"), `click` (visible text to click before the shot), `scrollTo` (text to
// scroll into view), `wait` (ms), `height` (crop to this many CSS px; default the
// screen), `name` (what it shows, for the alt-text list printed at the end).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const sb = join(site, '..', 'web', 'storybook-static');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.map': 'application/json' };
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = normalize(decodeURIComponent(url.pathname));
  try {
    const body = readFileSync(join(sb, path === '/' ? 'index.html' : path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const shots = JSON.parse(readFileSync(join(site, 'screenshots.json'), 'utf8'));
const only = process.argv[2]; // optional: a substring of `out`
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const sizes = [];
for (const s of shots) {
  if (only && !s.out.includes(only)) continue;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light' });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(e.message));
  const q = new URLSearchParams({ id: s.id, viewMode: 'story' });
  if (s.args) q.set('args', s.args);
  if (s.globals) q.set('globals', s.globals);
  await page.goto(`${base}/iframe.html?${q}`);
  await page.waitForSelector('#storybook-root > *', { timeout: 20000 });
  await page.waitForTimeout(s.wait ?? 1500);
  if (s.click) {
    await page.getByText(s.click, { exact: false }).first().click();
    await page.waitForTimeout(800);
  }
  if (s.scrollTo) await page.getByText(s.scrollTo, { exact: false }).first().scrollIntoViewIfNeeded();
  const full = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, 844));
  const height = Math.min(s.height ?? 844, full);
  const out = join(site, 'public', 'help', s.out);
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 390, height } });
  sizes.push({ out: s.out, w: 390, h: height, name: s.name ?? '', problems: problems.length });
  console.log(`wrote public/help/${s.out}  390x${height}${problems.length ? '  (page errors: ' + problems.length + ')' : ''}`);
  await ctx.close();
}
// The page reads these so a picture has its real shape before it loads (no jump).
const record = Object.fromEntries(sizes.map((z) => [z.out, { w: z.w, h: z.h }]));
writeFileSync(
  join(site, 'src', 'content', 'screenshotSizes.ts'),
  '// Written by scripts/screenshots.mjs; do not edit by hand.\nexport const SHOT_SIZES: Record<string, { w: number; h: number }> = ' + JSON.stringify(record, null, 2) + ';\n',
);
await browser.close();
server.close();
