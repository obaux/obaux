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

// "Still stuck?": the address while the help-request function is off (503), the form when it is on (400 to an empty
// probe), then Sent or That did not send. The function is stood in for here (Nico's contract, D-521).
{
  const run = async (probe, submit) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    // The form only asks the function from the real site's origin, so the page is served as https://joinpam.org
    await ctx.route('https://joinpam.org/**', async (route) => {
      const u = new URL(route.request().url());
      const r = await fetch(base + u.pathname + u.search);
      await route.fulfill({ status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'text/plain' }, body: Buffer.from(await r.arrayBuffer()) });
    });
    const page = await ctx.newPage();
    const calls = [];
    await page.route('**/functions/v1/help-request', async (route) => {
      const body = route.request().postData() ?? '';
      calls.push(body);
      const [status, json] = body === '{}' ? probe : submit;
      await route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(json) });
    });
    await page.goto('https://joinpam.org/support/start-here/', { waitUntil: 'networkidle' });
    await page.locator('#still-stuck').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    return { page, ctx, calls };
  };
  {
    // From localhost (CI, previews) and before the box is near the screen: no call to the function at all
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    let n = 0;
    await page.route('**/functions/v1/help-request', (route) => {
      n += 1;
      return route.fulfill({ status: 503, body: '{}' });
    });
    await page.goto(base + '/support/start-here/', { waitUntil: 'networkidle' });
    await page.locator('#still-stuck').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    if (n) fail(`help form: asked the function ${n} time(s) from a non-joinpam origin`);
    await ctx.close();
  }
  {
    // On the real origin: not before "Still stuck?" is near, and once per visit
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('https://joinpam.org/**', async (route) => {
      const u = new URL(route.request().url());
      const r = await fetch(base + u.pathname + u.search);
      await route.fulfill({ status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'text/plain' }, body: Buffer.from(await r.arrayBuffer()) });
    });
    const page = await ctx.newPage();
    let n = 0;
    await page.route('**/functions/v1/help-request', (route) => {
      n += 1;
      return route.fulfill({ status: 503, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"live":false}' });
    });
    await page.goto('https://joinpam.org/support/cant-sign-in/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const before = n;
    await page.locator('#still-stuck').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    if (before !== 0) fail('help form: asked the function on page load, before Still stuck? was near');
    if (n !== 1) fail(`help form: expected one call once Still stuck? was near, got ${n}`);
    await page.goto('https://joinpam.org/support/start-here/', { waitUntil: 'networkidle' });
    await page.locator('#still-stuck').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    if (n !== 1) fail(`help form: asked again on the next page in the same visit (${n} calls)`);
    await ctx.close();
  }
  {
    const { page, ctx } = await run([503, { live: false }], [503, { live: false }]);
    if (await page.getByRole('textbox', { name: /What’s wrong/ }).count()) fail('help form: shown while the function is off');
    if (!(await page.getByRole('link', { name: 'hello@joinpam.org' }).count())) fail('help form: no address while the function is off');
    await ctx.close();
  }
  for (const [label, submit, expected] of [
    ['on, sends', [200, { ok: true }], 'Sent. Thank you.'],
    ['on, fails', [502, { error: 'send_failed' }], 'That did not send.'],
  ]) {
    const { page, ctx, calls } = await run([400, { error: 'invalid', field: 'body' }], submit);
    const box = page.getByRole('textbox', { name: /What’s wrong/ });
    if (!(await box.count())) {
      fail(`help form (${label}): not shown when the function is on`);
    } else {
      if (label === 'on, sends') {
        await page.getByRole('button', { name: 'Send to Pam' }).click();
        await page.waitForTimeout(200);
        if (!(await page.getByText('Tell us what happened, in a few words.').count())) fail('help form: an empty message says nothing about what to do');
        await box.fill('x y z');
        await page.getByRole('textbox', { name: /How should we answer you/ }).fill('nope');
        await page.getByRole('button', { name: 'Send to Pam' }).click();
        await page.waitForTimeout(200);
        const wrong = await page.getByText('That email does not look right. Check it and try again.').count();
        const empty = await page.getByText('Add your email so we can write back.').count();
        if (!wrong && !empty) fail('help form: a wrong email says nothing about what to do');
      }
      await box.fill('I cannot get the code');
      await page.getByRole('textbox', { name: /How should we answer you/ }).fill('a@example.org');
      await page.getByRole('button', { name: 'Send to Pam' }).click();
      await page.waitForTimeout(400);
      if (!(await page.getByText(expected).count())) fail(`help form (${label}): did not say “${expected}”`);
      const sent = calls.find((c) => c !== '{}');
      if (!sent || JSON.parse(sent).website !== '' || JSON.parse(sent).page !== '/support/start-here/') fail(`help form (${label}): the request is wrong: ${sent}`);
      if (expected.startsWith('That') && !(await page.getByRole('link', { name: 'hello@joinpam.org' }).count())) fail('help form: a failed send does not show the address');
    }
    await ctx.close();
  }
}

// Iris H1 (b15): on Home, "Pause pictures" is on the first screen on a phone, and looks like a control (an icon in a pill).
{
  for (const [width, height] of [[320, 568], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    const pause = page.getByRole('button', { name: /pause pictures/i });
    const box = await pause.boundingBox();
    if (!box) fail(`home: no Pause pictures button at ${width}x${height}`);
    else {
      if (box.y + box.height > height || box.y < 0) fail(`home: Pause pictures is below the first screen at ${width}x${height} (y ${Math.round(box.y)}-${Math.round(box.y + box.height)})`);
      if (box.height < 47.5) fail(`home: Pause pictures is ${Math.round(box.height)}px tall at ${width}`);
      if (!(await pause.locator('svg').count())) fail('home: Pause pictures has no icon');
      const bg = await pause.evaluate((el) => getComputedStyle(el).backgroundColor);
      if (/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) fail('home: Pause pictures has no fill, so it reads as plain text');
    }
    await ctx.close();
  }
}

// W3: no page jumps as it loads (layout shift under 0.1 on a cold load), at phone and desktop width. The jump was the
// font swapping in; scripts/preload-font.mjs starts its download with the page.
{
  const { readdirSync, existsSync } = await import('node:fs');
  const slugs = readdirSync(join(out, 'support'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(out, 'support', d.name, 'index.html')))
    .map((d) => d.name);
  for (const width of [390, 1280]) {
    for (const slug of ['', ...slugs]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      await page.addInitScript(() => {
        window.__cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(`${base}/support/${slug ? `${slug}/` : ''}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const cls = await page.evaluate(() => window.__cls);
      if (cls > 0.1) fail(`layout shift: /support/${slug} at ${width}px shifts ${cls.toFixed(3)} while loading`);
      await page.close();
    }
  }
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} problem(s).` : 'usability: all clear');
process.exit(failures ? 1 : 0);
