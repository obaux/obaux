// DocuSign sandbox: checks on the signing pages (Iris, card a88). Test plan:
// docs/research/2026-10-14-docusign-sandbox-test-plan.md
//
// Made-up data only. This script never creates envelopes and never sees a DocuSign token. It opens a "mint" URL that
// Piper's spike serves: that page creates a fresh recipient view (5 minutes, one use) and redirects to it. The mint
// page's returnUrl must land on a page whose URL carries `event=…` (signing_complete, cancel, decline).
//
// Run (from apps/web, so Playwright resolves):
//   MINT_E1=http://127.0.0.1:4000/mint?env=E1 MINT_E100=… MINT_EAR=… \
//   PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node ../../docs/research/docusign-sandbox/signing-pages.mjs
// Writes results.json and shots/*.png next to this file. Nothing here types a real person's details.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(path.resolve('package.json'));
const { chromium, webkit } = require('@playwright/test');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(HERE, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const MADE_UP = { fullName: 'Test Member Ana', initials: 'TA', dob: '01/01/1990', ssn: '000-00-0000', householdSize: '3', annualIncome: '12000' };
const results = [];
const note = (q, name, data) => { results.push({ q, name, ...data }); console.log(`[${q}] ${name} ${JSON.stringify(data).slice(0, 300)}`); };
const exe = process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {};

async function openSigning(browser, mint, { w = 390, h = 844, locale = 'en-US', scheme = 'light', touch = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale, colorScheme: scheme, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  const hosts = new Set();
  page.on('request', (r) => { try { hosts.add(new URL(r.url()).hostname); } catch {} });
  const t0 = Date.now();
  await page.goto(mint, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  return { ctx, page, hosts, t0 };
}

// What any page looks like to a person and to a screen reader, without knowing DocuSign's markup.
const survey = (page) => page.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const name = (el) => (el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') || '').split(' ').map((id) => document.getElementById(id)?.innerText || '').join(' ') || el.labels?.[0]?.innerText || el.getAttribute('title') || el.placeholder || el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const targets = [...document.querySelectorAll('a,button,input,select,textarea,[role=button],[role=checkbox],[tabindex="0"]')].filter(vis);
  return {
    url: location.href.replace(/[?#].*/, ''), lang: document.documentElement.lang, dir: document.documentElement.dir || getComputedStyle(document.body).direction,
    scrollW: document.documentElement.scrollWidth, innerW: innerWidth,
    small: targets.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).map((e) => `${name(e) || e.tagName} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`).slice(0, 15),
    unnamed: targets.filter((e) => !name(e)).map((e) => e.tagName + (e.type ? ':' + e.type : '')).slice(0, 15),
    fields: [...document.querySelectorAll('input,textarea,select')].filter(vis).map((e) => ({ name: name(e), type: e.type, value: e.value ? '(filled)' : '', required: e.required || e.getAttribute('aria-required') === 'true' })).slice(0, 40),
    iframes: [...document.querySelectorAll('iframe')].map((f) => f.src.replace(/[?#].*/, '')),
  };
});

async function run() {
  const browser = await chromium.launch(exe);

  // Q3 + Q5: E1 at 390 and 320, light and dark; first screen, disclosure, aria tree.
  if (process.env.MINT_E1) {
    for (const [w, h] of [[390, 844], [320, 568]]) for (const scheme of ['light', 'dark']) {
      const { ctx, page, hosts, t0 } = await openSigning(browser, process.env.MINT_E1, { w, h, scheme });
      const s = await survey(page);
      note('Q3', `E1 first screen ${w}x${h} ${scheme}`, { ms: Date.now() - t0, ...s, hosts: [...hosts] });
      await page.screenshot({ path: path.join(SHOTS, `e1-first-${w}-${scheme}.png`) });
      if (w === 390 && scheme === 'light') fs.writeFileSync(path.join(HERE, 'aria-e1-first.txt'), await page.locator('body').ariaSnapshot().catch((e) => 'ERR ' + e.message));
      await ctx.close();
    }
    // Q5: keyboard order over the first screen
    {
      const { ctx, page } = await openSigning(browser, process.env.MINT_E1, { touch: false });
      const order = [];
      for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => { const a = document.activeElement; return `${a?.tagName}${a?.getAttribute('role') ? '/' + a.getAttribute('role') : ''} "${(a?.getAttribute('aria-label') || a?.innerText || '').trim().slice(0, 30)}" fv=${a?.matches(':focus-visible')}`; })); }
      note('Q5', 'E1 keyboard order (25 tabs)', { order });
      await ctx.close();
    }
    // Q2 + Q3 + Q5: walk the whole envelope, typing the made-up details only where a field is empty, and record what
    // was already filled when reached (that is "fill once"). DocuSign's step buttons are found by their names.
    {
      const { ctx, page, t0 } = await openSigning(browser, process.env.MINT_E1);
      const steps = [];
      for (let i = 0; i < 80; i++) {
        const s = await survey(page);
        if (/event=/.test(page.url())) break;
        const guided = await page.evaluate(() => { const a = document.activeElement; const r = a?.getBoundingClientRect(); return a && a !== document.body ? { tag: a.tagName, name: (a.getAttribute('aria-label') || a.getAttribute('title') || '').slice(0, 40), empty: 'value' in a ? !a.value : null, inView: r ? r.top >= 0 && r.bottom <= innerHeight : null, required: a.required || a.getAttribute('aria-required') === 'true' } : null; });
        steps.push({ i, focus: guided, fields: s.fields.map((f) => `${f.name}${f.value}${f.required ? ' [required]' : ''}`) });
        // agree to the disclosure, then Continue / Start / Next / Finish, whichever is there
        const cb = page.getByRole('checkbox').first(); if (await cb.count() && !(await cb.isChecked().catch(() => true))) await cb.check().catch(() => {});
        for (const f of await page.locator('input[type=text]:visible, input:not([type]):visible').all()) {
          if (await f.inputValue().catch(() => 'x')) continue;
          const label = ((await f.getAttribute('aria-label')) || '').toLowerCase();
          const v = /household/.test(label) ? MADE_UP.householdSize : /income/.test(label) ? MADE_UP.annualIncome : /ssn|social/.test(label) ? MADE_UP.ssn : /birth|dob/.test(label) ? MADE_UP.dob : /initial/.test(label) ? MADE_UP.initials : /name/.test(label) ? MADE_UP.fullName : null;
          if (v) await f.fill(v).catch(() => {});
        }
        const btn = page.getByRole('button', { name: /^(continue|start|next|finish|adopt and sign|adopt and initial|sign|initial)$/i }).first();
        if (!(await btn.count())) break;
        await btn.click().catch(() => {}); await page.waitForTimeout(900);
      }
      note('Q2', 'E1 walk: fields seen per step ("(filled)" = already filled when reached)', { steps, endUrl: page.url().replace(/^.*\?/, '?'), ms: Date.now() - t0 });
      await page.screenshot({ path: path.join(SHOTS, 'e1-end.png') });
      await ctx.close();
    }
    // Q3: the iframe, for the record only (Chromium and WebKit)
    for (const [label, bt] of [['chromium', chromium], ['webkit', webkit]]) {
      let b2;
      try { b2 = label === 'chromium' ? browser : await bt.launch(); } catch (e) { note('Q3', `iframe ${label}`, { skipped: e.message.split('\n')[0] }); continue; }
      const ctx = await b2.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      await page.setContent(`<!doctype html><meta name=viewport content="width=device-width"><body style="margin:0"><iframe src="${process.env.MINT_E1}&display=focused" style="border:0;width:100vw;height:100vh"></iframe>`);
      await page.waitForTimeout(8000);
      const f = page.frames()[1];
      note('Q3', `iframe ${label} (record only)`, { loaded: !!f, url: f?.url().replace(/[?#].*/, ''), text: f ? (await f.locator('body').innerText().catch(() => '')).slice(0, 120) : '' });
      await page.screenshot({ path: path.join(SHOTS, `iframe-${label}.png`) });
      await ctx.close(); if (b2 !== browser) await b2.close();
    }
  }

  // Q4: Arabic
  if (process.env.MINT_EAR) {
    const { ctx, page } = await openSigning(browser, process.env.MINT_EAR, { w: 320, h: 568, locale: 'ar' });
    const s = await survey(page);
    const text = (await page.locator('body').innerText()).slice(0, 600);
    note('Q4', 'E-ar first screen 320x568', { ...s, arabicShare: (text.match(/[؀-ۿ]/g) || []).length / Math.max(1, text.replace(/\s/g, '').length), sample: text.slice(0, 200) });
    await page.screenshot({ path: path.join(SHOTS, 'ear-first-320.png') });
    fs.writeFileSync(path.join(HERE, 'aria-ear-first.txt'), await page.locator('body').ariaSnapshot().catch((e) => 'ERR ' + e.message));
    await ctx.close();
  }

  // Q6: 100 documents
  if (process.env.MINT_E100) {
    const { ctx, page, t0 } = await openSigning(browser, process.env.MINT_E100);
    const firstField = await page.locator('input:visible, button:visible').first().waitFor({ timeout: 120000 }).then(() => Date.now() - t0).catch(() => null);
    const m = await page.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null));
    const counter = (await page.locator('body').innerText()).match(/\b\d+\s*(of|\/)\s*\d+\b/i)?.[0] || null;
    note('Q6', 'E100 open', { msToFirstControl: firstField, heapMB: m, counterText: counter });
    await page.screenshot({ path: path.join(SHOTS, 'e100-first.png') });
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(HERE, 'results.json'), JSON.stringify(results, null, 1));
  console.log(`\nWrote ${results.length} results to ${path.join(HERE, 'results.json')} and shots to ${SHOTS}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
