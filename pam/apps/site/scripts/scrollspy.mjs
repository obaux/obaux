// The "On this page" menu of every post, in a browser, on the built site (apps/site/out): at 320, 390 and 1280px,
// each link must bring its heading fully into view, below whatever is stuck to the top of the screen, and the
// link you tapped must be the one marked `aria-current`. Also: no sideways scroll, and the menu lists the post's
// own sections. It runs with reduced motion (the page jumps); SMOOTH=1 runs it with the scroll animated (slower).
//
//   pnpm --filter @pam/site build && node apps/site/scripts/scrollspy.mjs   (from pam/)
//
// Needs Playwright's Chromium (or CHROMIUM_PATH). Exits 1 on any failure.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'out');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
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

const posts = readdirSync(join(out, 'support'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(out, 'support', d.name, 'index.html')))
  .map((d) => `/support/${d.name}/`);
const views = [
  { name: '320', viewport: { width: 320, height: 640 } },
  { name: '390', viewport: { width: 390, height: 844 } },
  { name: '1280', viewport: { width: 1280, height: 800 } },
];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let failures = 0;
let checked = 0;
const fail = (msg) => {
  failures += 1;
  console.log(`FAIL ${msg}`);
};

for (const view of views) {
  const ctx = await browser.newContext({ viewport: view.viewport, reducedMotion: process.env.SMOOTH ? 'no-preference' : 'reduce' });
  const page = await ctx.newPage();
  const wide = view.viewport.width >= 1180;
  for (const path of posts) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    const label = `${view.name} ${path}`;
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) fail(`${label}: horizontal scroll`);
    const nav = page.locator(wide ? 'nav[aria-label="On this page"]:visible' : 'nav[aria-label="On this page"]:visible').first();
    if (!(await nav.count())) {
      fail(`${label}: no "On this page" menu`);
      continue;
    }
    const ids = await page.evaluate(() => Array.from(document.querySelectorAll('[data-post-section]')).map((e) => e.id));
    if (ids.length < 2) fail(`${label}: fewer than two sections`);
    for (const id of ids) {
      if (!wide) {
        // the bar opens to its list
        const trigger = nav.locator('button').first();
        if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
      }
      await nav.locator(`a[href="#${id}"]`).click();
      await page.waitForTimeout(process.env.SMOOTH ? 1400 : 250);
      const r = await page.evaluate((id) => {
        const section = document.getElementById(id);
        const h = section.querySelector('h2') ?? section;
        const rect = h.getBoundingClientRect();
        const bar = Array.from(document.querySelectorAll('nav[aria-label="On this page"]')).find((n) => n.offsetParent !== null && getComputedStyle(n).position === 'sticky' && n.getBoundingClientRect().top <= 1);
        const stuck = bar ? bar.getBoundingClientRect().bottom : 0;
        const link = Array.from(document.querySelectorAll('nav[aria-label="On this page"]')).filter((n) => n.offsetParent !== null).flatMap((n) => Array.from(n.querySelectorAll(`a[href="#${id}"]`)))[0];
        return { top: rect.top, bottom: rect.bottom, stuck, vh: innerHeight, current: link?.getAttribute('aria-current'), hash: location.hash, focused: document.activeElement?.id, outline: document.activeElement ? getComputedStyle(document.activeElement).outlineStyle : '' };
      }, id);
      checked += 1;
      if (r.top < r.stuck - 0.5) fail(`${label} #${id}: heading hidden under the menu (top ${Math.round(r.top)}, menu bottom ${Math.round(r.stuck)})`);
      if (r.bottom > r.vh + 0.5) fail(`${label} #${id}: heading below the screen (bottom ${Math.round(r.bottom)} of ${r.vh})`);
      if (r.current !== 'location') fail(`${label} #${id}: the link tapped is not aria-current (${r.current})`);
      if (r.hash !== `#${id}`) fail(`${label} #${id}: the address did not follow (${r.hash})`);
      if (r.outline !== 'none') fail(`${label} #${id}: the focused section shows an outline (${r.outline})`);
      if (r.focused !== id) fail(`${label} #${id}: focus did not move to the section (${r.focused})`);
    }
    // scrolling by hand moves the highlight: top of the page is the first section
    await page.mouse.move(view.viewport.width / 2, view.viewport.height / 2);
    await page.mouse.wheel(0, -100000);
    await page.waitForTimeout(1500);
    const first = await page.evaluate(() => {
      const first = document.querySelector('[data-post-section]').id;
      const link = Array.from(document.querySelectorAll('nav[aria-label="On this page"]')).filter((n) => n.offsetParent !== null).flatMap((n) => Array.from(n.querySelectorAll('a[aria-current="location"]')))[0];
      return { first, current: link?.getAttribute('href') };
    });
    if (first.current && first.current !== `#${first.first}`) fail(`${label}: at the top of the page the highlight is ${first.current}, not #${first.first}`);
  }
  await ctx.close();
}
await browser.close();
server.close();
console.log(`${checked} section links checked in ${posts.length} posts at ${views.map((v) => v.name).join(', ')}px, ${failures} problem(s)`);
process.exit(failures ? 1 : 0);
