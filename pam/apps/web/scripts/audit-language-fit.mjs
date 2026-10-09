#!/usr/bin/env node
/**
 * Does the text fit? Every Storybook story, in every language, at 320px.
 *
 * Words get longer in Russian, wider in Arabic's longest forms, taller in
 * Chinese and Thai-style stacking; a layout that was tuned on English strings
 * quietly crops, truncates or overlaps them. Nothing throws and the page does
 * not scroll sideways, so no ordinary test notices (D-413). This opens each
 * story in each language and measures it instead.
 *
 *   pnpm --filter @pam/web build-storybook
 *   node apps/web/scripts/audit-language-fit.mjs [--locales ru,ar] [--match Cards/] [--out file.json]
 *     [--from earlier.json]   re-check only the stories that run found defects in
 *   SB_ROOT=dir                 measure another Storybook build
 *
 * What is a defect (all measured from the rendered page, text node by text node):
 *   cut      a word that is part inside, part outside a box that hides overflow
 *            (a fixed-height card, an `overflow: hidden` row, a viewport edge)
 *   ellipsis `text-overflow: ellipsis` is actually trimming something
 *   clamp    `line-clamp` is hiding lines
 *   spill    text runs past the edge of the button / link / field it sits in
 *   overlap  two different elements' text lines cover each other
 *   scroll   the page itself scrolls sideways
 *
 * English is the baseline: a defect that is already there in English is the
 * design's, not the translation's, and is listed apart. Only defects that are
 * NEW in a language are what the run fails on.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const LOCALES = opt('locales', 'en,es,pt-BR,zh-CN,zh-HK,ru,ar').split(',');
const MATCH = opt('match', '');
const WIDTH = Number(opt('width', '320'));
const WORKERS = Number(opt('workers', '4'));
const OUT = opt('out', '');
const FROM = opt('from', '');
const ROOT = path.resolve(process.env.SB_ROOT ?? path.join(here, '../storybook-static'));

// ── a tiny static server: `python -m http.server` is one thread, and four workers queue on it ──
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf', '.map': 'application/json', '.jpg': 'image/jpeg',
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let file = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT)) return void res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) return void res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${server.address().port}`;

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'));
const stories = Object.values(index.entries).filter(
  (e) => e.type === 'story' && !e.title.startsWith('Foundations/') && e.id.includes(MATCH.toLowerCase()),
);
if (FROM) {
  // Re-check only the stories a previous run found defects in.
  const again = new Set(JSON.parse(fs.readFileSync(FROM, 'utf8')).fresh.map((f) => f.id));
  for (let i = stories.length - 1; i >= 0; i--) if (!again.has(stories[i].id)) stories.splice(i, 1);
}
console.error(`${stories.length} stories × ${LOCALES.length} languages at ${WIDTH}px`);

/** Runs in the page. Returns [{kind, key, text, detail}]. */
function measure() {
  const out = [];
  const vw = document.documentElement.clientWidth;
  const sig = (el) => {
    const parts = [];
    for (let n = el; n && n !== document.body && parts.length < 7; n = n.parentElement) {
      const cls = [...n.classList].filter((c) => !/^x[a-z0-9]{4,}/.test(c)).slice(0, 1).join('.');
      const idx = n.parentElement ? [...n.parentElement.children].indexOf(n) : 0;
      parts.push(`${n.tagName.toLowerCase()}${cls ? '.' + cls : ''}:${idx}`);
    }
    return parts.reverse().join('>');
  };
  const style = (el) => getComputedStyle(el);
  const hidden = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const s = style(n);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return true;
      if (n.hasAttribute('hidden')) return true;
      // The visually-hidden idiom: 1px, clipped.
      if (s.position === 'absolute' && n.clientWidth <= 1 && n.clientHeight <= 1) return true;
    }
    return false;
  };
  const clipsOf = (el) => {
    const clips = [];
    // The element holding the text counts too: a fixed-height box that hides its overflow cuts its own words.
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const s = style(n);
      const ox = s.overflowX, oy = s.overflowY;
      const cx = ox === 'hidden' || ox === 'clip';
      const cy = oy === 'hidden' || oy === 'clip';
      if (!cx && !cy) continue;
      const r = n.getBoundingClientRect();
      clips.push({ n, left: r.left + n.clientLeft, right: r.left + n.clientLeft + n.clientWidth, top: r.top + n.clientTop, bottom: r.top + n.clientTop + n.clientHeight, cx, cy });
    }
    return clips;
  };
  // A scroller (auto/scroll) is the intended way to reach what is beyond its edge.
  const inScroller = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const s = style(n);
      if ((s.overflowX === 'auto' || s.overflowX === 'scroll') && n.scrollWidth > n.clientWidth + 1) return n;
    }
    return null;
  };

  const lines = []; // for overlap: {el, rect, text}
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  const push = (kind, el, text, detail) => {
    const key = `${kind}|${sig(el)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ kind, key, text: text.trim().slice(0, 60), detail });
  };

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? '';
    if (!text.trim()) continue;
    const el = node.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName) || hidden(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
    if (!rects.length) continue;

    // 1. Cut: part of the text inside a clip box, part outside it.
    const clips = clipsOf(el);
    const scroller = inScroller(el);
    const box = (r) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    let inside = 0, outside = 0, partial = false, handled = false;
    const visible = [];
    for (const r of rects) {
      let vis = true, part = false;
      const b = box(r);
      const test = (c) => {
        const xOut = c.cx && (b.left < c.left - 1 || b.right > c.right + 1);
        const yOut = c.cy && (b.top < c.top - 1 || b.bottom > c.bottom + 1);
        if (!xOut && !yOut) return;
        // A line box overhanging its clip by a sliver (a CJK font's taller metrics, an avatar's
        // initial) loses no glyph: a cut is a fifth of the line or more.
        const hx = c.cx ? Math.max(0, c.left - b.left, b.right - c.right) / Math.max(1, b.right - b.left) : 0;
        const hy = c.cy ? Math.max(0, c.top - b.top, b.bottom - c.bottom) / Math.max(1, b.bottom - b.top) : 0;
        if (Math.max(hx, hy) < 0.2) return;
        // Fully gone (a carousel's other slides, an off-canvas drawer) is not a cut.
        const gone = (c.cx && (b.right <= c.left + 1 || b.left >= c.right - 1)) || (c.cy && (b.bottom <= c.top + 1 || b.top >= c.bottom - 1));
        if (gone) vis = false;
        else part = true;
        // An ellipsis or a line clamp is the designed way to cut; step 2 reports it if it bites.
        if (c.n && (style(c.n).textOverflow === 'ellipsis' || (style(c.n).webkitLineClamp ?? 'none') !== 'none')) handled = true;
      };
      for (const c of clips) test(c);
      // The viewport's side edges clip too, unless a scroller owns the text.
      if (!scroller) test({ cx: true, cy: false, left: 0, right: vw });
      if (vis && !part) inside += 1;
      else if (part) partial = true;
      else outside += 1;
      // Only text wholly inside its box can collide: a line an ellipsis is trimming still reports its full width.
      if (vis && !part) visible.push(r);
    }
    if ((partial || (inside > 0 && outside > 0)) && !handled) {
      push('cut', el, text, `${inside} in, ${outside} out, partial=${partial}`);
    }

    // 2. Ellipsis actually trimming, line-clamp actually hiding.
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const s = style(n);
      if (s.textOverflow === 'ellipsis' && s.overflowX === 'hidden' && n.scrollWidth > n.clientWidth + 1) {
        push('ellipsis', n, n.textContent ?? '', `${n.scrollWidth} > ${n.clientWidth}`);
        break;
      }
      const lc = s.webkitLineClamp;
      if (lc && lc !== 'none' && n.scrollHeight > n.clientHeight + 1) {
        push('clamp', n, n.textContent ?? '', `${n.scrollHeight} > ${n.clientHeight}`);
        break;
      }
    }

    // 3. Spill: text outside the control that holds it.
    const control = el.closest('button, a, [role="button"], [role="tab"], [role="radio"], [role="menuitem"], input, label, summary');
    if (control && !hidden(control)) {
      const c = control.getBoundingClientRect();
      for (const r of rects) {
        if (r.left < c.left - 2 || r.right > c.right + 2 || r.top < c.top - 2 || r.bottom > c.bottom + 2) {
          // A link wrapping a whole card is bigger than its text by design; only text outside counts.
          push('spill', control, text, `text ${Math.round(r.left)}..${Math.round(r.right)} in ${Math.round(c.left)}..${Math.round(c.right)}`);
          break;
        }
      }
    }
    // A bar that floats over the page (the tab bar, the legal footer) covers
    // whatever scrolls beneath it by design; only text in the same layer can collide.
    let layer = null;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const pos = style(n).position;
      if (pos === 'fixed' || pos === 'sticky') { layer = n; break; }
    }
    for (const r of visible) lines.push({ el, r, text, layer });
  }

  // 4. Overlap: two unrelated elements' lines covering each other.
  const box2 = lines.filter((l) => l.r.width > 6 && l.r.height > 6);
  for (let i = 0; i < box2.length && i < 700; i++) {
    for (let j = i + 1; j < box2.length && j < 700; j++) {
      const a = box2[i], b = box2[j];
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el) || a.layer !== b.layer) continue;
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (w > 4 && h > Math.min(a.r.height, b.r.height) * 0.4) {
        // Text drawn deliberately over a picture/marker (badge on a photo) shares a stacking context; two
        // text-carrying siblings that overlap are the problem we want.
        push('overlap', a.el, `${a.text.trim().slice(0, 28)} ⟷ ${b.text.trim().slice(0, 28)}`, `${Math.round(w)}×${Math.round(h)}`);
      }
    }
  }

  // 5. The page scrolling sideways.
  if (document.documentElement.scrollWidth > vw + 1) {
    push('scroll', document.body, '(page)', `${document.documentElement.scrollWidth} > ${vw}`);
  }
  return out;
}

async function run() {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
  const jobs = [];
  for (const story of stories) for (const locale of LOCALES) jobs.push({ story, locale });
  const results = [];
  let next = 0;
  const failures = [];
  await Promise.all(
    Array.from({ length: WORKERS }, async () => {
      const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 760 }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      for (;;) {
        const i = next++;
        if (i >= jobs.length) break;
        const { story, locale } = jobs[i];
        try {
          await page.goto(`${BASE}/iframe.html?id=${story.id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'load', timeout: 30000 });
          await page.waitForFunction(() => document.querySelector('#storybook-root')?.childElementCount > 0 || document.querySelector('.sb-errordisplay')?.offsetParent, null, { timeout: 15000 });
          await page.evaluate(() => document.fonts?.ready);
          if (locale !== 'en') {
            await page.waitForFunction((l) => document.documentElement.lang === l, locale, { timeout: 8000 }).catch(() => {});
          }
          // Journeys fetch their fixtures after first paint: measure once the page has stopped changing.
          for (let prev = -1, calm = 0, tries = 0; calm < 3 && tries < 30; tries++) {
            await page.waitForTimeout(150);
            const size = await page.evaluate(() => document.body.innerHTML.length);
            calm = size === prev ? calm + 1 : 0;
            prev = size;
          }
          const found = await page.evaluate(measure);
          results.push({ id: story.id, title: story.title, name: story.name, locale, found });
        } catch (error) {
          failures.push({ id: story.id, locale, error: String(error).split('\n')[0] });
        }
        if (i % 100 === 0) console.error(`  ${i}/${jobs.length}`);
      }
      await ctx.close();
    }),
  );
  await browser.close();
  server.close();
  return { results, failures };
}

const { results, failures } = await run();

// ── English is the baseline; only what is new in a language counts ──
const baseline = new Set();
for (const r of results) if (r.locale === 'en') for (const f of r.found) baseline.add(`${r.id}|${f.key}`);
const fresh = [];
for (const r of results) {
  if (r.locale === 'en') continue;
  for (const f of r.found) if (!baseline.has(`${r.id}|${f.key}`)) fresh.push({ id: r.id, title: r.title, name: r.name, locale: r.locale, ...f });
}
const existing = results.filter((r) => r.locale === 'en').flatMap((r) => r.found.map((f) => ({ id: r.id, title: r.title, ...f })));

if (OUT) fs.writeFileSync(OUT, JSON.stringify({ fresh, existing, failures }, null, 2));

const by = (list, f) => list.reduce((m, x) => ((m[f(x)] = (m[f(x)] ?? 0) + 1), m), {});
console.log(`\nNEW in a language (not in English): ${fresh.length}`);
console.log(' by kind  :', JSON.stringify(by(fresh, (x) => x.kind)));
console.log(' by locale:', JSON.stringify(by(fresh, (x) => x.locale)));
console.log(`Already in English (the design's own): ${existing.length}  ${JSON.stringify(by(existing, (x) => x.kind))}`);
if (failures.length) console.log(`Could not measure: ${failures.length} (${failures.slice(0, 3).map((f) => f.id + ':' + f.error).join('; ')})`);
for (const x of fresh.slice(0, 400)) console.log(`${x.locale.padEnd(6)} ${x.kind.padEnd(8)} ${x.id}  «${x.text}»  ${x.detail}`);
process.exitCode = fresh.length ? 1 : 0;
