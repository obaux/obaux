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
    // read first: a file that is not there (a page's prefetch) must answer 404, not crash after the headers went out
    const body = readFileSync(join(out, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(body);
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
        // Will, 14 October: a text box draws no ring in any mode (the cursor shows where you are); everything else does
        const textBox = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'range', 'color'].includes(el.type));
        if (textBox) return { label: `${el.tagName.toLowerCase()} “${label}”`, textBox: true, drawsRing: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, key: `${el.tagName}|${label}|${Math.round(el.getBoundingClientRect().top)}` };
        return { label: `${el.tagName.toLowerCase()} “${label}”`, ring: !!ring || (wrap && getComputedStyle(wrap).boxShadow !== 'none'), key: `${el.tagName}|${label}|${Math.round(el.getBoundingClientRect().top)}` };
      });
      if (!r) break;
      if (stops.has(r.key)) break;
      stops.add(r.key);
      if (r.textBox) {
        if (r.drawsRing) fail(`focus ring: ${path} ${r.label} draws an outline, text boxes draw none (Will, 14 October)`);
        continue;
      }
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

// "On this page" (Mira, 23 October): on a long post every entry becomes the current one when its section is reached, the
// last headings included, and the menu stays where it is (the end of the page used to push it off the top of the screen).
{
  for (const [name, viewport] of [['1280', { width: 1280, height: 800 }], ['390', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base + '/support/something-didnt-go-through/', { waitUntil: 'networkidle' });
    const nav = page.locator('nav[aria-label="On this page"]:visible').first();
    const ids = await page.evaluate(() => [...document.querySelectorAll('[data-post-section]')].map((e) => e.id));
    for (const id of ids) {
      if (viewport.width < 1180) {
        const trigger = nav.locator('button').first();
        if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
      }
      await nav.locator(`a[href="#${id}"]`).click();
      await page.waitForTimeout(300);
      const r = await page.evaluate((id) => {
        const bar = [...document.querySelectorAll('nav[aria-label="On this page"]')].find((n) => n.offsetParent !== null);
        const section = document.getElementById(id);
        const top = (section.querySelector('h2') ?? section).getBoundingClientRect().top;
        const link = bar.querySelector(`a[href="#${id}"]`);
        return { top, menuTop: bar.getBoundingClientRect().top, barBottom: bar.getBoundingClientRect().bottom, current: link?.getAttribute('aria-current') };
      }, id);
      const edge = viewport.width < 1180 ? r.barBottom : 0;
      if (r.top < edge - 0.5 || r.top > viewport.height) fail(`on this page ${name}: #${id}'s heading is not in view (top ${Math.round(r.top)}px)`);
      if (viewport.width >= 1180 && r.menuTop < 0) fail(`on this page ${name}: at #${id} the menu is pushed off the top of the screen (${Math.round(r.menuTop)}px)`);
      if (r.current !== 'location') fail(`on this page ${name}: #${id} is not the current entry when its section is reached`);
    }
    await ctx.close();
  }
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
  // S1 (Iris, 22 October): a suggested post opens the post, by tap and by Enter. It used to search for the post's title.
  for (const how of ['tap', 'Enter']) {
    await page.goto(base + '/support/', { waitUntil: 'networkidle' });
    await input().click();
    await page.keyboard.type('texts from pa');
    await page.waitForTimeout(600);
    if (how === 'tap') await page.locator('[role="option"]', { hasText: 'Texts from Pam:' }).first().click();
    else {
      await page.locator('[role="option"]', { hasText: 'Texts from Pam:' }).first().waitFor();
      const at = await page.evaluate(() => [...document.querySelectorAll('[role="option"]')].findIndex((o) => o.textContent.includes('Texts from Pam:')));
      // the first suggestion is already highlighted when the list opens
      for (let i = 0; i < at; i += 1) await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(800);
    if (!/\/support\/texts-from-pam\/?$/.test(new URL(page.url()).pathname)) fail(`search S1: ${how} on a suggested post should open it, the page is ${page.url()}`);
  }
  // S2: after a search the box keeps its words, so a typo can be mended.
  await page.goto(base + '/support/', { waitUntil: 'networkidle' });
  await input().click();
  await page.keyboard.type('xyzzy plumbus');
  await page.waitForTimeout(600);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  if (!(await page.getByRole('heading', { name: /No results for “xyzzy plumbus”/ }).count())) fail('search S2: Enter should show the results');
  if ((await input().inputValue()) !== 'xyzzy plumbus') fail(`search S2: after Enter the box should keep “xyzzy plumbus”, it has “${await input().inputValue()}”`);
  if (!(await page.evaluate(() => document.activeElement?.getAttribute('role') === 'combobox'))) fail('search S2: after Enter the cursor should stay in the box');
  // S3: one count, said once. Only one live region may hold a result count.
  await page.goto(base + '/support/', { waitUntil: 'networkidle' });
  await input().click();
  await page.keyboard.type('cancel');
  await page.waitForTimeout(1100);
  const counts = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-live], [role="status"], [role="alert"]')]
      .filter((e) => e.getAttribute('aria-live') !== 'off' && /\bresults?\b/i.test(e.textContent ?? ''))
      .map((e) => (e.textContent ?? '').trim()),
  );
  if (counts.length !== 1) fail(`search S3: a result count should be spoken by one live region, ${counts.length} speak: ${JSON.stringify(counts)}`);
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
  const run = async (probe, submit, width = 390) => {
    const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 800 } });
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
    const opener = page.getByRole('button', { name: 'Write to us' });
    if (!(await opener.count())) {
      fail(`help form (${label}): no call-out button when the function is on`);
    } else if (await box.isVisible()) {
      fail(`help form (${label}): the form is on the page itself, it should only open from the call-out (Will, 13 October)`);
    } else {
      await opener.click();
      await page.waitForTimeout(500);
      if (!(await box.isVisible())) fail(`help form (${label}): the call-out did not open the form`);
      if (!(await page.evaluate(() => !!document.activeElement?.closest('dialog')))) fail(`help form (${label}): focus did not go into the form`);
      if (!(await page.evaluate(() => document.activeElement?.tagName === 'TEXTAREA'))) fail(`help form (${label}): the message box should have focus as the form opens, so the keyboard comes up`);
      // Esc closes it and focus goes back to the button; then open it again to fill it in.
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      if (await box.isVisible()) fail(`help form (${label}): Esc did not close the form`);
      if (!(await page.evaluate(() => document.activeElement?.textContent?.includes('Write to us')))) fail(`help form (${label}): focus did not return to the call-out button after Esc`);
      await opener.click();
      await page.waitForTimeout(500);
      if (label === 'on, sends') {
        await page.getByRole('button', { name: 'Send to Pam' }).click();
        await page.waitForTimeout(200);
        if (!(await page.getByText('Tell us what happened, in a few words.').count())) fail('help form: an empty message says nothing about what to do');
        // Iris W1: an empty Send puts focus in the first field in error, and the field's description is its error
        const described = (name) =>
          page.evaluate((n) => {
            const el = document.activeElement;
            const label = el?.getAttribute('aria-label') ?? el?.labels?.[0]?.textContent ?? '';
            const text = (el?.getAttribute('aria-describedby') ?? '').split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
            return { tag: el?.tagName, invalid: el?.getAttribute('aria-invalid'), label, text, n };
          }, name);
        const w1 = await described('message');
        const ringless = () => page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0; });
        if (!(await ringless())) fail('help form: the focused message box draws an outline, text boxes draw none (Will, 14 October)');
        if (w1.tag !== 'TEXTAREA' || w1.invalid !== 'true' || !/Tell us what happened, in a few words\./.test(w1.text)) fail(`help form (W1): an empty Send should focus the message box and describe it with its error, focus is on ${JSON.stringify(w1)}`);
        await box.fill('x y z');
        await page.getByRole('textbox', { name: /How should we answer you/ }).fill('nope');
        await page.getByRole('button', { name: 'Send to Pam' }).click();
        await page.waitForTimeout(200);
        const wrong = await page.getByText('That email does not look right. Check it and try again.').count();
        const empty = await page.getByText('Add your email so we can write back.').count();
        if (!wrong && !empty) fail('help form: a wrong email says nothing about what to do');
        const w1b = await described('email');
        if (!(await ringless())) fail('help form: the focused email box draws an outline, text boxes draw none');
        if (w1b.tag !== 'INPUT' || w1b.invalid !== 'true' || !/email/i.test(w1b.text)) fail(`help form (W1): a wrong email should focus the email box and describe it with its error, focus is on ${JSON.stringify(w1b)}`);
      }
      await box.fill('I cannot get the code');
      await page.getByRole('checkbox', { name: 'I run a program' }).check();
      await page.getByRole('checkbox', { name: 'I’m a case manager' }).check();
      await page.getByRole('textbox', { name: /How should we answer you/ }).fill('a@example.org');
      await page.getByRole('button', { name: 'Send to Pam' }).click();
      await page.waitForTimeout(400);
      if (!(await page.getByText(expected).count())) fail(`help form (${label}): did not say “${expected}”`);
      if (label === 'on, sends') {
        // Iris P2: after a successful Send focus goes to the thank-you, not the page
        const onThanks = await page.evaluate(() => document.activeElement?.id === 'help-sent' && /Sent\. Thank you\./.test(document.activeElement.textContent ?? ''));
        if (!onThanks) fail('help form (P2): after Send, focus should be on the thank-you block');
      }
      const sent = calls.find((c) => c !== '{}');
      if (!sent || JSON.parse(sent).website !== '' || JSON.parse(sent).page !== '/support/start-here/') fail(`help form (${label}): the request is wrong: ${sent}`);
      if (sent && (JSON.stringify(JSON.parse(sent).roles) !== '["program","case_manager"]' || 'role' in JSON.parse(sent))) fail(`help form (${label}): how-you-use-Pam did not go as roles: ${sent}`);
      if (expected.startsWith('That') && !(await page.getByRole('link', { name: 'hello@joinpam.org' }).count())) fail('help form: a failed send does not show the address');
    }
    await ctx.close();
  }
  {
    for (const [width, check] of [[390, (b, f) => Math.abs(b.width - f.width) <= 2], [1280, (b, f) => b.width < 360 && Math.abs(b.x - f.left) <= 2]]) {
      const { page, ctx } = await run([400, { error: 'invalid', field: 'body' }], [200, { ok: true }], width);
      const btn = page.getByRole('button', { name: 'Write to us' });
      if (!(await btn.count())) fail(`help call-out at ${width}px: no button`);
      else {
        const b = await btn.boundingBox();
        const f = await page.locator('#still-stuck > div').first().evaluate((el) => { const r = el.querySelector('p')?.getBoundingClientRect(); return { left: r.left, width: r.width }; });
        if (!check(b, f)) fail(`"Write to us" at ${width}px is ${Math.round(b.width)}px wide (left ${Math.round(b.x)}), the line above is ${Math.round(f.width)}px wide (left ${Math.round(f.left)})`);
      }
      await ctx.close();
    }
  }
}

// Will, 23 October: the hero's pictures are for a desktop only. Under 900px there is no carousel, no Pause button and no hero
// picture is asked for; from 900px the carousel is there, with its Pause button (Iris H1, b15: a pill with an icon and a fill).
{
  for (const [width, height] of [[320, 568], [390, 844], [899, 844]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true });
    const page = await ctx.newPage();
    const asked = [];
    page.on('request', (r) => {
      if (/\/art\/hero-/.test(r.url())) asked.push(r.url());
    });
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    if (await page.getByRole('button', { name: /pause pictures|play pictures|show the next picture/i }).count()) fail(`home: the picture carousel is on the page at ${width}px`);
    if (await page.locator('[aria-roledescription="carousel"]').count()) fail(`home: a carousel is on the page at ${width}px`);
    if (asked.length) fail(`home: a hero picture was asked for at ${width}px: ${asked.join(', ')}`);
    const h1 = await page.locator('h1').first().boundingBox();
    if (!h1 || h1.y > height / 2) fail(`home: the words should start the page at ${width}px (the headline is at y ${Math.round(h1?.y ?? -1)})`);
    await ctx.close();
  }
  for (const [width, height] of [[900, 800], [1280, 800]]) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const pause = page.getByRole('button', { name: /pause pictures/i });
    const box = await pause.boundingBox();
    if (!box) fail(`home: no Pause pictures button at ${width}px`);
    else {
      if (box.height < 47.5) fail(`home: Pause pictures is ${Math.round(box.height)}px tall at ${width}`);
      if (!(await pause.locator('svg').count())) fail('home: Pause pictures has no icon');
      const bg = await pause.evaluate((el) => getComputedStyle(el).backgroundColor);
      if (/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) fail('home: Pause pictures has no fill, so it reads as plain text');
    }
    await ctx.close();
  }
}

// The programs row carries the DocuSign tag, and says "Coming soon" beside it while DocuSign signing is not live.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const row = page.locator('h2', { hasText: 'Your services, built around people.' }).locator('xpath=..');
  if (!(await row.getByText('DocuSign integration').count())) fail('home: the programs row has no "DocuSign integration" tag');
  if (!(await row.getByText('Coming soon').count())) fail('home: the DocuSign tag does not say "Coming soon"');
  await ctx.close();
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

// The green card on Home (Will, 13 October, a77): no arrows, it moves on by itself with a fill behind the active name, a tap
// stops it, Pause / Play works, reduced motion stops it all, and a screen reader is not told about the timer's changes.
{
  const selected = (page) => page.locator('[data-band] [role="tab"][aria-selected="true"]').innerText();
  const open = async (opts) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts });
    const page = await ctx.newPage();
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.locator('[data-band]').scrollIntoViewIfNeeded();
    return { ctx, page };
  };
  {
    const { ctx, page } = await open({});
    if (await page.locator('[data-band] [role="tab"] svg').count()) fail('green card: the names still carry an arrow');
    if (!(await page.locator('[data-band-fill]').count())) fail('green card: no fill behind the active name');
    if ((await selected(page)).trim() !== 'Residents') fail('green card: it should start on Residents');
    await page.waitForTimeout(6800);
    if ((await selected(page)).trim() !== 'Program Providers') fail(`green card: it should move on to Program Providers by itself, it shows ${(await selected(page)).trim()}`);
    if ((await page.locator('[data-band] [role="status"]').first().innerText()).trim()) fail('green card: the timer’s change was spoken to a screen reader');
    await page.getByRole('tab', { name: 'Case managers' }).click();
    await page.mouse.move(0, 0);
    if ((await selected(page)).trim() !== 'Case managers') fail('green card: a tap should show that name');
    if (!(await page.locator('[data-band] [role="status"]').allInnerTexts()).join(' ').includes('Their plans')) fail('green card: a person’s choice should be spoken');
    if (await page.locator('[data-band-fill]').count()) fail('green card: the fill keeps running after a tap');
    await page.waitForTimeout(6800);
    if ((await selected(page)).trim() !== 'Case managers') fail('green card: it kept moving after a tap');
    await page.getByRole('button', { name: 'Play card' }).click();
    await page.mouse.move(0, 0); // the pointer in the card holds the cycle, so take it away
    await page.waitForTimeout(6800);
    if ((await selected(page)).trim() !== 'Residents') fail(`green card: Play should start it again (Case managers goes round to Residents), it shows ${(await selected(page)).trim()}`);
    await page.getByRole('button', { name: 'Pause card' }).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(6800);
    if ((await selected(page)).trim() !== 'Residents') fail('green card: Pause did not stop it');
    await ctx.close();
  }
  {
    // A finger: tap Pause, then Play, without leaving the button. The button keeps focus, and that must not hold the cycle.
    const { ctx, page } = await open({ hasTouch: true });
    const before = (await selected(page)).trim();
    await page.getByRole('button', { name: 'Pause card' }).tap();
    await page.waitForTimeout(6800);
    if ((await selected(page)).trim() !== before) fail('green card: it moved on while paused (touch)');
    await page.getByRole('button', { name: 'Play card' }).tap();
    await page.waitForTimeout(6800);
    if ((await selected(page)).trim() === before) fail('green card: after Pause then Play with a finger, the next name never arrived (a tapped button holds focus)');
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ reducedMotion: 'reduce' });
    await page.waitForTimeout(6800);
    if ((await selected(page)).trim() !== 'Residents') fail('green card: it moves on under reduced motion');
    if (await page.locator('[data-band-fill]').count()) fail('green card: a fill under reduced motion');
    if (await page.getByRole('button', { name: /^(Pause|Play) card$/ }).count()) fail('green card: a Pause button under reduced motion (nothing moves)');
    await page.getByRole('tab', { name: 'Program Providers' }).focus();
    await page.keyboard.press('ArrowRight');
    if ((await selected(page)).trim() !== 'Case managers') fail('green card: the arrow keys should move between the names');
    await ctx.close();
  }
}

// a83 (Will, 13 October): the grey Still stuck? card is 60px above the footer on a phone and 120px from 900px.
{
  for (const [width, want] of [[390, 60], [1280, 120]]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await ctx.newPage();
    for (const path of ['/support/', '/support/cant-sign-in/', '/support/start-here/', '/support/your-safety/']) {
      await page.goto(base + path, { waitUntil: 'load' });
      const gap = await page.evaluate(() => {
        // a post that ends without the Still stuck? card (Your safety) ends the same way, measured from its article
        const card = document.querySelector('#still-stuck') ?? document.querySelector('article[data-page="post"]').lastElementChild;
        const foot = document.querySelector('footer');
        return Math.round(foot.getBoundingClientRect().top - card.getBoundingClientRect().bottom);
      });
      if (Math.abs(gap - want) > 1) fail(`${path} at ${width}px: ${gap}px between the Still stuck? card and the footer, expected ${want}`);
    }
    await ctx.close();
  }
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} problem(s).` : 'usability: all clear');
process.exit(failures ? 1 : 0);
