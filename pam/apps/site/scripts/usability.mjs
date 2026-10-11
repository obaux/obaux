// Keyboard and touch checks on the built site (apps/site/out), in a browser (Iris's help-site findings, 11 October):
//  - every link, button and field shows a visible focus ring when reached with Tab (S2),
//  - on a phone, every link and button is at least 48px tall, with a 48px target (W4; a lone link counts its padding),
//  - the search box has a landmark, a skip link goes to it, Esc clears it, and the query is in the address (W2, W6).
//
//   pnpm --filter @pam/site build && CHROMIUM_PATH=... node apps/site/scripts/usability.mjs   (from pam/)
//
// Exits 1 on any failure. SHOW=1 lists the targets that are too small instead of failing (to find them).
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'out');
const { chromium } = createRequire(import.meta.url)('playwright-core');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (path.endsWith('/')) path += 'index.html';
  try {
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(readFileSync(join(out, path)));
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(0);
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let failures = 0;
const fail = (m) => {
  failures += 1;
  console.log(`FAIL ${m}`);
};
const PAGES = ['/', '/support/', '/support/cant-sign-in/', '/support/your-safety/', '/support/start-here/', '/support/joining-pam/'];

// S2: Tab through the page; each stop must have an outline or a box-shadow ring that you can see.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    const stops = new Set();
    for (let i = 0; i < 60; i += 1) {
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 && cs.outlineColor !== 'rgba(0, 0, 0, 0)') || (cs.boxShadow && cs.boxShadow !== 'none');
        // a focus ring drawn by a child or an ancestor wrapper (a search pill) counts
        const wrap = el.closest('[data-focus-within],[class*="focus"]');
        const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40);
        return { label: `${el.tagName.toLowerCase()} “${label}”`, ring: !!ring || (wrap && getComputedStyle(wrap).boxShadow !== 'none'), key: `${el.tagName}|${label}|${Math.round(el.getBoundingClientRect().top)}` };
      });
      if (!r) break;
      if (stops.has(r.key)) break;
      stops.add(r.key);
      if (!r.ring) fail(`focus ring: ${path} ${r.label} shows none when reached with Tab`);
    }
  }
  await ctx.close();
}

// W4: touch targets on a phone.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    const small = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('a[href], button, input, [role="combobox"]')) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        // an inline link inside a sentence is exempt (WCAG 2.5.8); a link on a line of its own is not
        const block = el.closest('p, li, td, th, dd');
        const inline = !!block && block !== el && /\S/.test(block.textContent.replace(el.textContent, ''));
        if (inline) continue;
        if (el.closest('[aria-hidden="true"]')) continue;
        if (el.tagName === 'INPUT' && el.closest('[role="search"]')) continue; // the search pill is checked below: a tap anywhere in it focuses the box
        if (r.height < 47.5 || r.width < 47.5) out.push(`${el.tagName.toLowerCase()} “${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}” ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
      return out;
    });
    for (const s of small) {
      if (process.env.SHOW) console.log(`small ${path} ${s}`);
      else fail(`touch target: ${path} ${s}`);
    }
  }
  await ctx.close();
}

// W4, the search field: the pill is 48px or more tall, and a tap near its top edge, not on the text, focuses the box.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(base + '/support/', { waitUntil: 'networkidle' });
  const pill = await page.evaluate(() => {
    const input = document.querySelector('[role="search"] input');
    let el = input;
    while (el && el.parentElement && el.parentElement.getAttribute('role') !== 'search') el = el.parentElement;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (pill.h < 47.5) fail(`touch target: the search pill is ${Math.round(pill.w)}×${Math.round(pill.h)}`);
  await page.touchscreen.tap(pill.x + pill.w / 2, pill.y + 5);
  if (!(await page.evaluate(() => document.activeElement?.tagName === 'INPUT'))) fail('touch target: a tap near the top edge of the search pill does not focus the box');
  await ctx.close();
}

// W2 and W6: the search keeps its words in the address, has a landmark, is read out as a count; a skip link; Esc clears.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const input = () => page.locator('[role="search"] input').first();
  await page.goto(base + '/support/?q=cant%20sign%20in', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  if ((await input().inputValue()) !== 'cant sign in') fail(`search: /support/?q= should fill the box, it has “${await input().inputValue()}”`);
  if (!(await page.getByRole('heading', { name: /result.* for “cant sign in”/ }).count())) fail('search: /support/?q= should show the results');
  if (!(await page.locator('[role="search"]').count())) fail('search: no search landmark');
  if (await page.locator('main [aria-live="polite"]:not([role="status"])').count()) fail('search: the results list is a live region (it would read every keystroke)');
  // Back from an article brings the search back.
  await page.getByRole('link', { name: /I can’t sign in/ }).first().click();
  await page.waitForURL(/\/support\/cant-sign-in\//);
  await page.goBack({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  if ((await input().inputValue()) !== 'cant sign in') fail(`search: Back should bring the words back, the box has “${await input().inputValue()}”`);
  // Typing puts the words in the address.
  await page.goto(base + '/support/', { waitUntil: 'networkidle' });
  await input().click();
  await page.keyboard.type('sms');
  await page.waitForTimeout(500);
  if (!page.url().includes('q=sms')) fail(`search: typing should put ?q=sms in the address, it is ${page.url()}`);
  // Esc closes the suggestions, then empties the search.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  if ((await input().inputValue()) !== '') await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  if ((await input().inputValue()) !== '') fail(`search: Esc should clear the box, it has “${await input().inputValue()}”`);
  if (page.url().includes('q=')) fail(`search: Esc should clear ?q= from the address, it is ${page.url()}`);
  // The skip link is the first stop, and goes to the page.
  await page.goto(base + '/support/cant-sign-in/', { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
  if (first !== 'Skip to main content') fail(`skip link: the first Tab stop is “${first}”`);
  await page.keyboard.press('Enter');
  if ((await page.evaluate(() => document.activeElement?.id)) !== 'main') fail('skip link: Enter should move focus to the main content');
  await ctx.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} problem(s).` : 'usability: all clear');
process.exit(failures ? 1 : 0);
