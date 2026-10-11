// Makes public/og/add-program.jpg: what the "Add your program" link looks like
// when it is pasted into a text (Will, 10 October 2026: "a social image with
// logo, and under 'Add your program'"). Same look as public/og/invite.jpg: one
// carousel picture in its own colours with a light veil, a soft shade only
// behind the words, the white wordmark in the centre, the words under it.
//
//   node scripts/og-add-program.mjs
//
// The picture is the first carousel one (the city: places, and a program is a
// place). English only, like the invite's. sharp comes with Next.
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const W = 1200;
const H = 630;
const TOP = 300; // which rows of the 1200-wide picture to keep

const base = await sharp(join(root, 'onboarding', 'hero-city.webp'))
  .resize({ width: W })
  .extract({ left: 0, top: TOP, width: W, height: H })
  .toBuffer();

const wordmark = await sharp(readFileSync(join(root, 'pam-wordmark-white.svg')), { density: 300 })
  .resize({ width: 300 })
  .png()
  .toBuffer();
const wm = await sharp(wordmark).metadata();

const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="shade" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#0b1020" stop-opacity="0.5"/>
      <stop offset="0.65" stop-color="#0b1020" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#0b1020" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#ffffff" fill-opacity="0.06"/>
  <ellipse cx="${W / 2}" cy="${H / 2 + 8}" rx="520" ry="215" fill="url(#shade)"/>
  <text x="${W / 2}" y="420" text-anchor="middle" fill="#ffffff"
        font-family="Inter, 'Inter Display', 'DejaVu Sans', sans-serif" font-size="58" font-weight="600">Add your program</text>
</svg>`);

const out = join(root, 'og', 'add-program.jpg');
await sharp(base)
  .composite([
    { input: overlay, left: 0, top: 0 },
    { input: wordmark, left: Math.round((W - wm.width) / 2), top: 205 },
  ])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(out);
console.log(`${out}: ${Math.round(statSync(out).size / 1024)} KB`);
