// Pam's icon, for every Pam website — one source, so they cannot drift apart.
//
// The icon is the wordmark's "p" alone, white, on the wordmark's deep green
// (#0F5847). The full "pam" is an unreadable smudge at 16px (D-437). The "p" is
// taken from the canonical wordmark (apps/web/public/pam-wordmark-light.svg).
//
//   node scripts/make-icons.mjs        (from pam/; needs Playwright's Chromium,
//                                       or set CHROMIUM_PATH)
//
// Writes, and you commit:
//   apps/site/src/app/   icon.svg  apple-icon.png  favicon.ico   the public site
//   apps/web/src/app/    icon.svg  apple-icon.png  favicon.ico   the member app
//   apps/web/public/     icon-192.png icon-512.png icon-maskable-512.png   its manifest
//   apps/web/.storybook/public/favicon.svg                        Storybook
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(import.meta.url)('playwright-core');

const wordmark = readFileSync(join(root, 'apps/web/public/pam-wordmark-light.svg'), 'utf8');
const pPath = /d="([^"]+)"/.exec(wordmark.match(/<path[^>]*\/>/g)[2])[1]; // p, a, m — drawn right to left
const P = { w: 113.76, h: 152.25 }; // the glyph's own box

/** A 64×64 icon: green square with the p, `glyph` tall. `rx` rounds the corners. */
function svg({ rx, glyph }) {
  const s = glyph / P.h;
  const x = (64 - P.w * s) / 2;
  const y = (64 - glyph) / 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="${rx}" fill="#0F5847"/>` +
    `<path transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(5)})" d="${pPath}" fill="#fff"/></svg>\n`
  );
}

const rounded = svg({ rx: 14, glyph: 40 }); // browser tabs, "any" PWA icons
const square = svg({ rx: 0, glyph: 38 }); // the OS rounds it (Apple touch icon)
const maskable = svg({ rx: 0, glyph: 32 }); // inside the 80% safe zone

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
async function png(source, size) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const uri = `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`;
  await page.setContent(`<style>*{margin:0}</style><img src="${uri}" width="${size}" height="${size}">`);
  const buf = await page.screenshot({ omitBackground: true });
  await page.close();
  return buf;
}
/** An .ico holding PNGs at 16, 32 and 48. */
async function ico() {
  const sizes = [16, 32, 48];
  const images = await Promise.all(sizes.map((n) => png(rounded, n)));
  const head = Buffer.alloc(6 + 16 * sizes.length);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(sizes.length, 4);
  let offset = head.length;
  sizes.forEach((n, i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(n, e);
    head.writeUInt8(n, e + 1);
    head.writeUInt16LE(1, e + 4);
    head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(images[i].length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += images[i].length;
  });
  return Buffer.concat([head, ...images]);
}

const write = (rel, data) => {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
  console.log('wrote', rel);
};

const apple = await png(square, 180);
const favicon = await ico();
for (const app of ['apps/site', 'apps/web']) {
  write(`${app}/src/app/icon.svg`, rounded);
  write(`${app}/src/app/apple-icon.png`, apple);
  write(`${app}/src/app/favicon.ico`, favicon);
}
write('apps/web/public/icon-192.png', await png(rounded, 192));
write('apps/web/public/icon-512.png', await png(rounded, 512));
write('apps/web/public/icon-maskable-512.png', await png(maskable, 512));
write('apps/web/.storybook/public/favicon.svg', rounded);
await browser.close();
