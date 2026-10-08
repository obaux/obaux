#!/usr/bin/env node
/**
 * Draws PAM's user flows (docs/user-flows/flows.mjs) as one self-contained
 * HTML page per flow, with a real screenshot of every screen, ready to import
 * into Figma (html_to_figma). See docs/user-flows/README.md.
 *
 *   pnpm --filter @pam/web build-storybook
 *   node scripts/user-flows.mjs            # all flows
 *   node scripts/user-flows.mjs super-admin  # one flow (and the overview)
 *
 * Writes user-flows-out/<key>.html and user-flows-out/overview.html. Nothing
 * here talks to the live project: every screen is a Storybook story on its
 * pretend database.
 */
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { flows, UPDATED } from '../../../docs/user-flows/flows.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, '..');
const repo = join(web, '..', '..');
const staticDir = join(web, 'storybook-static');
const out = join(web, 'user-flows-out');
const only = process.argv[2] ?? null;

if (!existsSync(join(staticDir, 'iframe.html'))) {
  console.error('Build Storybook first: pnpm --filter @pam/web build-storybook');
  process.exit(1);
}
mkdirSync(join(out, 'thumbs'), { recursive: true });

// --- A tiny static server for storybook-static (keeps the query string). ---
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const file = join(staticDir, path.endsWith('/') ? `${path}index.html` : path);
  if (!file.startsWith(staticDir) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

// --- Screenshots. ---
const W = 390;
const H = 844;
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });

async function act(page, step) {
  if (step.wait) return page.waitForTimeout(step.wait);
  if (step.press) return page.keyboard.press(step.press);
  if (step.fill) return page.getByLabel(step.fill, { exact: true }).first().fill(step.value);
  if (step.click) {
    for (const role of ['button', 'link']) {
      const el = page.getByRole(role, { name: step.click, exact: false });
      if (await el.count()) return el.first().click();
    }
    return page.getByText(step.click, { exact: false }).first().click();
  }
}

async function shoot(node, thumbPath) {
  if (node.image) {
    const raw = readFileSync(join(repo, node.image));
    const page = await browser.newPage({ viewport: { width: 600, height: 315 } });
    await page.setContent(`<body style="margin:0"><img style="width:600px;height:315px;display:block" src="data:image/jpeg;base64,${raw.toString('base64')}"></body>`);
    writeFileSync(thumbPath, await page.screenshot({ type: 'jpeg', quality: 60 }));
    await page.close();
    return { data: raw.toString('base64'), type: 'image/jpeg' };
  }
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 0.5 });
  await page.goto(`${base}/iframe.html?id=${node.story}&viewMode=story`);
  await page.waitForTimeout(2500);
  for (const step of node.actions ?? []) await act(page, step);
  await page.waitForTimeout(400);
  // Half size for Figma (a thumbnail goes inline in a use_figma script, which
  // is size-limited); full size for the HTML page.
  writeFileSync(thumbPath, await page.screenshot({ type: 'jpeg', quality: 60 }));
  await page.setViewportSize({ width: W, height: H });
  const full = await browser.newPage({ viewport: { width: W, height: H } });
  await full.goto(page.url());
  await full.waitForTimeout(2500);
  for (const step of node.actions ?? []) await act(full, step);
  await full.waitForTimeout(400);
  const buf = await full.screenshot({ type: 'jpeg', quality: 78 });
  await full.close();
  await page.close();
  return { data: buf.toString('base64'), type: 'image/jpeg' };
}

// --- Layout: a tidy tree, left to right. ---
const CARD = 240; // screen width on the map
const SHOT = Math.round((CARD * H) / W);
const WIDE = 420;
const WIDE_SHOT = Math.round((WIDE * 630) / 1200);
const HEAD = 64; // title + route above the screen
const NOTE = 44; // note under the screen
const GAP_X = 190;
const GAP_Y = 64;
const TOP = 300; // room for the title block

const cardW = (n) => (n.wide ? WIDE : CARD);
const shotH = (n) => (n.wide ? WIDE_SHOT : SHOT);
const cardH = (n) => HEAD + shotH(n) + NOTE;

function layout(flow) {
  const pos = {};
  const colW = [];
  let cursor = TOP;
  const children = (id) => flow.edges.filter(([a]) => a === id).map(([, b]) => b);
  const place = (id, depth) => {
    if (pos[id]) return;
    const node = flow.nodes[id];
    pos[id] = { depth, y: cursor };
    colW[depth] = Math.max(colW[depth] ?? 0, cardW(node));
    const kids = children(id).filter((k) => !pos[k]);
    if (kids.length === 0) {
      cursor += cardH(node) + GAP_Y;
      return;
    }
    const start = cursor;
    for (const k of kids) place(k, depth + 1);
    pos[id].y = start;
    cursor = Math.max(cursor, start + cardH(node) + GAP_Y);
  };
  for (const r of flow.roots) place(r, 0);
  for (const id of Object.keys(flow.nodes)) place(id, 0);
  const colX = [];
  let x = 80;
  for (let d = 0; d < colW.length; d++) {
    colX[d] = x;
    x += (colW[d] ?? CARD) + GAP_X;
  }
  for (const id of Object.keys(pos)) pos[id].x = colX[pos[id].depth];
  return { pos, width: Math.max(x, 1400) + 40, height: cursor + 40 };
}

// --- Drawing. ---
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const INK = '#111111';
const MUTED = '#666666';
const ACCENT = '#0F5847';
const NEW = '#E8590C';
const FONT = "Inter, 'Helvetica Neue', Arial, sans-serif";

function card(id, node, p, shot, latest) {
  const w = cardW(node);
  const isNew = node.changed && latest.includes(node.changed);
  return `
<div class="card" data-node="${esc(id)}" style="position:absolute;left:${p.x}px;top:${p.y}px;width:${w}px;">
  <div style="display:flex;align-items:center;gap:8px;height:28px;">
    <span style="font:700 17px/1.2 ${FONT};color:${INK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(node.title)}</span>
    ${node.changed ? `<span style="font:700 11px/1 ${FONT};color:#fff;background:${isNew ? NEW : '#9A9A9A'};border-radius:999px;padding:4px 8px;flex-shrink:0;">${esc(node.changed)}</span>` : ''}
  </div>
  <div style="font:500 12px/1.4 'SF Mono', Menlo, monospace;color:${MUTED};height:28px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(node.path ?? '')}</div>
  <img src="data:${shot.type};base64,${shot.data}" width="${w}" height="${shotH(node)}" style="display:block;width:${w}px;height:${shotH(node)}px;border-radius:${node.wide ? 16 : 28}px;border:${isNew ? `3px solid ${NEW}` : '1px solid #D9D9D9'};box-sizing:border-box;object-fit:cover;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.10),0 1px 3px rgba(0,0,0,.06);">
  <div style="font:400 13px/1.35 ${FONT};color:${MUTED};margin-top:8px;height:${NOTE - 8}px;overflow:hidden;">${esc(node.note ?? '')}</div>
</div>`;
}

function edge(flow, [from, to, label, opts], pos, index) {
  const a = flow.nodes[from];
  const b = flow.nodes[to];
  const pa = pos[from];
  const pb = pos[to];
  const dashed = opts?.dashed ? 'stroke-dasharray="8 7"' : '';
  const color = opts?.dashed ? '#8A8A8A' : INK;
  let d;
  let lx;
  let ly;
  // `over`: a forward link that would cross other cards in its row goes
  // over the top instead (D-270: A place → Policies to sign, past Trips).
  if (pb.x > pa.x && !opts?.over) {
    const sx = pa.x + cardW(a);
    const sy = pa.y + HEAD + 40 + index * 22;
    const tx = pb.x - 6;
    const ty = pb.y + HEAD + 40;
    const mx = (sx + tx) / 2;
    d = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
    lx = mx;
    ly = (sy + ty) / 2;
  } else {
    // A way back or across: over the top of the cards.
    const sx = pa.x + cardW(a) / 2;
    const sy = pa.y - 4;
    const tx = pb.x + cardW(b) / 2;
    const ty = pb.y - 10;
    const lift = Math.min(sy, ty) - 70;
    d = `M ${sx} ${sy} C ${sx} ${lift}, ${tx} ${lift}, ${tx} ${ty}`;
    lx = (sx + tx) / 2;
    ly = lift + 18;
  }
  return {
    path: `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" ${dashed} marker-end="url(#arrow${opts?.dashed ? 'Muted' : ''})"/>`,
    label: label
      ? `<div style="position:absolute;left:${lx}px;top:${ly}px;transform:translate(-50%,-50%);background:#fff;border:1px solid #DADADA;border-radius:999px;padding:5px 10px;font:600 12px/1.2 ${FONT};color:${INK};white-space:nowrap;">${esc(label)}</div>`
      : '',
  };
}

function header(flow, width) {
  return `
<div style="position:absolute;left:80px;top:56px;width:${Math.min(width - 160, 1100)}px;">
  <div style="font:600 14px/1 ${FONT};color:${ACCENT};letter-spacing:0.06em;text-transform:uppercase;">PAM · User flows · ${esc(flow.title)}</div>
  <div style="font:800 44px/1.1 ${FONT};color:${INK};margin-top:14px;">${esc(flow.title)}</div>
  <div style="font:400 18px/1.5 ${FONT};color:#333;margin-top:12px;max-width:820px;">${esc(flow.intro)}</div>
  <div style="display:flex;gap:18px;align-items:center;margin-top:18px;font:500 13px/1 ${FONT};color:${MUTED};">
    <span>Updated ${esc(UPDATED)}</span>
    <span style="display:inline-flex;align-items:center;gap:6px;"><span style="background:${NEW};color:#fff;border-radius:999px;padding:4px 8px;font-weight:700;">D-###</span> changed in the latest round</span>
    <span>— solid arrow: a tap · dashed: leaves the app, or a way back</span>
  </div>
</div>`;
}

function changesPanel(flow, width) {
  if (!flow.changes?.length) return '';
  return `
<div style="position:absolute;left:${width - 460}px;top:56px;width:400px;background:#FFFFFF;border-radius:20px;padding:20px 22px;box-sizing:border-box;">
  <div style="font:700 15px/1.2 ${FONT};color:${INK};">Latest changes</div>
  ${flow.changes.map((c) => `<div style="font:400 13px/1.45 ${FONT};color:#333;margin-top:8px;">${esc(c)}</div>`).join('')}
</div>`;
}

function page(title, width, height, body, svg) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>html,body{margin:0;background:#ECECEA;}</style></head>
<body><div id="canvas" style="position:relative;width:${width}px;height:${height}px;background:#ECECEA;overflow:hidden;">
<svg width="${width}" height="${height}" style="position:absolute;left:0;top:0;" xmlns="http://www.w3.org/2000/svg">
<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${INK}"/></marker>
<marker id="arrowMuted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#8A8A8A"/></marker>
</defs>
${svg}
</svg>
${body}
</div></body></html>`;
}

const latestDecisions = (flow) => (flow.changes ?? []).slice(0, 2).map((c) => c.split(' ')[0]);
const homes = {};

for (const flow of flows) {
  if (only && flow.key !== only) continue;
  const { pos, width, height } = layout(flow);
  const shots = {};
  for (const [id, node] of Object.entries(flow.nodes)) {
    shots[id] = await shoot(node, join(out, 'thumbs', `${flow.key}--${id}.jpg`));
    process.stdout.write('.');
  }
  homes[flow.key] = shots[flow.roots[0]];
  const latest = latestDecisions(flow);
  const perSource = {};
  const drawn = flow.edges.map((e) => {
    const i = (perSource[e[0]] = (perSource[e[0]] ?? -1) + 1);
    return edge(flow, e, pos, i);
  });
  const body =
    header(flow, width) +
    changesPanel(flow, width) +
    Object.entries(flow.nodes).map(([id, n]) => card(id, n, pos[id], shots[id], latest)).join('') +
    drawn.map((d) => d.label).join('');
  writeFileSync(
    join(out, `${flow.key}.layout.json`),
    JSON.stringify({
      key: flow.key,
      title: flow.title,
      intro: flow.intro,
      changes: flow.changes ?? [],
      updated: UPDATED,
      width,
      height,
      latest,
      card: { width: CARD, shot: SHOT, wide: WIDE, wideShot: WIDE_SHOT, head: HEAD, note: NOTE },
      nodes: Object.fromEntries(
        Object.entries(flow.nodes).map(([id, n]) => [
          id,
          { ...pos[id], w: cardW(n), shotH: shotH(n), title: n.title, path: n.path ?? '', note: n.note ?? '', changed: n.changed ?? null, story: n.story ?? null, wide: !!n.wide },
        ]),
      ),
      edges: flow.edges.map(([a, b, label, o]) => ({ from: a, to: b, label: label ?? '', dashed: !!o?.dashed, over: !!o?.over })),
    }),
  );
  writeFileSync(join(out, `${flow.key}.html`), page(`PAM — ${flow.title}`, width, height, body, drawn.map((d) => d.path).join('\n')));
  console.log(` ${flow.key}: ${Object.keys(flow.nodes).length} screens, ${flow.edges.length} links → ${width}×${height}`);
}

// --- The overview: one card per flow, in the order a person meets them. ---
if (!only) {
  const OW = 300;
  const CARDS_TOP = 440;
  const gap = 60;
  const width = 80 * 2 + flows.length * OW + (flows.length - 1) * gap;
  const cards = flows
    .map((f, i) => {
      const x = 80 + i * (OW + gap);
      const shot = homes[f.key];
      const h = Math.round((OW * (f.nodes[f.roots[0]].wide ? 630 : H)) / (f.nodes[f.roots[0]].wide ? 1200 : W));
      return `
<div style="position:absolute;left:${x}px;top:${CARDS_TOP}px;width:${OW}px;">
  <div style="font:800 24px/1.2 ${FONT};color:${INK};">${esc(f.title)}</div>
  <div style="font:400 14px/1.45 ${FONT};color:#444;margin-top:8px;height:104px;overflow:hidden;">${esc(f.intro)}</div>
  <img src="data:${shot.type};base64,${shot.data}" width="${OW}" height="${h}" style="display:block;width:${OW}px;height:${h}px;border-radius:28px;border:1px solid #D9D9D9;box-sizing:border-box;margin-top:12px;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.10),0 1px 3px rgba(0,0,0,.06);">
  <div style="font:600 13px/1.4 ${FONT};color:${ACCENT};margin-top:12px;">${Object.keys(f.nodes).length} screens · page “${esc(f.title)}”</div>
</div>`;
    })
    .join('');
  const latest = flows.flatMap((f) => (f.changes ?? []).slice(0, 1).map((c) => `${f.title}: ${c}`));
  const body = `
<div style="position:absolute;left:80px;top:56px;width:${width - 160}px;">
  <div style="font:600 14px/1 ${FONT};color:${ACCENT};letter-spacing:0.06em;text-transform:uppercase;">PAM · User flows</div>
  <div style="font:800 52px/1.1 ${FONT};color:${INK};margin-top:14px;">How PAM fits together</div>
  <div style="font:400 18px/1.5 ${FONT};color:#333;margin-top:12px;max-width:900px;">Every screen of the app, by the person using it, drawn from the real screens in Storybook. Each page in this file is one person's app; arrows are taps. Updated ${esc(UPDATED)}.</div>
  <div style="font:400 14px/1.6 ${FONT};color:#444;margin-top:14px;">${latest.map(esc).join('<br>')}</div>
</div>${cards}`;
  const height = CARDS_TOP + 150 + Math.round((OW * H) / W) + 120;
  writeFileSync(join(out, 'overview.html'), page('PAM — User flows', width, height, body, ''));
  console.log(` overview → ${width}×${height}`);
}

await browser.close();
server.close();
