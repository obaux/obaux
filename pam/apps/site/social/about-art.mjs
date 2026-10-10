// Draws the "About Pam" picture and renders it twice from the same art:
//   public/art/about-pam.webp   1600×600  the header on each language page
//   public/og/about-pam.png     1200×630  the share image (every language uses it)
// Run from apps/site:  node social/about-art.mjs
// No words in it, so one picture serves all seven languages. Colours are the theme's data
// palette (packages/ui/src/theme/pam.css, `--color-data-<hue>-<1..5>`), written out because
// this is a picture file, not a page. Style is the kit's: flat two-tone lit from the left,
// diagonal shards, Memphis shapes, print grain, no outlines, no faces.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const K = {
  blue1: '#DBECFF', blue2: '#78BEFF', blue3: '#2694FE', blue4: '#004CBC',
  teal1: '#D7FCF8', teal2: '#6CE6D8', teal3: '#0DB7AF', teal4: '#0C9293', teal5: '#08767D',
  pink1: '#FCE3F4', pink2: '#FEADE3', pink3: '#F989D3', pink4: '#D123A1',
  purple1: '#E8E8FB', purple2: '#B3B0FE', purple3: '#9081FF', purple4: '#6B1EFD', purple5: '#3E0697',
  yellow1: '#FDF6BA', yellow2: '#FCEC85', yellow3: '#FBCE03', yellow4: '#D69804',
  orange1: '#FFE6CF', orange2: '#FDB876', orange3: '#FD9537', orange4: '#D66100', orange5: '#A13F04',
  green2: '#8EF7AA', green3: '#24BB5E', green4: '#138546', green5: '#0B603D',
  red3: '#FF6B5E', red4: '#D9352A',
  white: '#FFFFFF',
};

// The scene is drawn on a 1000 × 500 board and centred on a ground of any size.
function scene(w, h) {
  const s = Math.min((w * 0.94) / 1000, (h * 0.9) / 500);
  const tx = (w - 1000 * s) / 2;
  const ty = (h - 500 * s) / 2;
  const dots = [];
  // The dotted path: building door -> phone -> calendar. Solid dots, not dashes.
  const path = [
    [230, 440], [262, 452], [296, 456], [330, 452], [360, 440],
    [640, 440], [672, 452], [706, 456], [740, 452], [770, 440],
  ];
  for (const [x, y] of path) dots.push(`<circle cx="${x}" cy="${y}" r="7" fill="${K.pink4}"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="${K.blue1}"/>
  <polygon points="0,${h} 0,${h * 0.35} ${w * 0.42},${h} " fill="${K.teal1}"/>
  <polygon points="${w},0 ${w},${h * 0.7} ${w * 0.55},0" fill="${K.pink1}"/>
  <polygon points="${w * 0.2},0 ${w * 0.34},0 ${w * 0.1},${h * 0.5} 0,${h * 0.5} 0,${h * 0.3}" fill="${K.purple1}"/>
  <g transform="translate(${tx} ${ty}) scale(${s})">
    <!-- ground strip -->
    <rect x="-400" y="462" width="1800" height="400" fill="${K.teal2}"/>
    <polygon points="-400,462 300,462 120,520 -400,520" fill="${K.teal3}"/>

    <!-- the building: a place that helps -->
    <rect x="70" y="210" width="170" height="252" fill="${K.orange3}"/>
    <rect x="175" y="210" width="65" height="252" fill="${K.orange4}"/>
    <polygon points="55,210 255,210 155,150" fill="${K.red3}"/>
    <polygon points="155,150 255,210 205,210" fill="${K.red4}"/>
    <rect x="125" y="364" width="52" height="98" rx="4" fill="${K.purple5}"/>
    <rect x="95" y="240" width="38" height="38" rx="3" fill="${K.yellow2}"/>
    <rect x="165" y="240" width="38" height="38" rx="3" fill="${K.yellow3}"/>
    <rect x="95" y="300" width="38" height="38" rx="3" fill="${K.yellow2}"/>
    <rect x="165" y="300" width="38" height="38" rx="3" fill="${K.yellow3}"/>
    <rect x="152" y="104" width="5" height="48" fill="${K.purple5}"/>
    <polygon points="157,104 197,118 157,132" fill="${K.pink4}"/>

    <!-- the phone: lit from the left, darker right half -->
    <rect x="388" y="26" width="224" height="436" rx="40" fill="${K.purple4}"/>
    <path d="M500 26 H572 a40 40 0 0 1 40 40 V422 a40 40 0 0 1 -40 40 H500 Z" fill="${K.purple5}"/>
    <rect x="406" y="50" width="188" height="388" rx="26" fill="${K.yellow1}"/>
    <rect x="470" y="34" width="60" height="8" rx="4" fill="${K.purple5}"/>

    <!-- three message bubbles on the screen: a place, a time, done -->
    <rect x="420" y="76" width="140" height="84" rx="22" fill="${K.teal3}"/>
    <polygon points="440,160 440,182 462,160" fill="${K.teal3}"/>
    <path d="M490 96 c-16 0 -28 12 -28 27 c0 20 28 34 28 34 s28 -14 28 -34 c0 -15 -12 -27 -28 -27 z" fill="${K.white}"/>
    <circle cx="490" cy="123" r="9" fill="${K.teal5}"/>

    <rect x="440" y="196" width="140" height="84" rx="22" fill="${K.orange3}"/>
    <polygon points="560,280 560,302 538,280" fill="${K.orange3}"/>
    <circle cx="510" cy="238" r="30" fill="${K.white}"/>
    <path d="M510 218 V238 L526 247" stroke="${K.orange5}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

    <rect x="420" y="316" width="140" height="84" rx="22" fill="${K.green3}"/>
    <polygon points="440,400 440,422 462,400" fill="${K.green3}"/>
    <circle cx="490" cy="358" r="30" fill="${K.white}"/>
    <path d="M474 358 L486 370 L508 345" stroke="${K.green5}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

    <!-- the calendar: a day to remember -->
    <rect x="745" y="130" width="190" height="212" rx="18" fill="${K.white}"/>
    <path d="M845 130 H917 a18 18 0 0 1 18 18 V342 a18 18 0 0 1 -18 18 H845 Z" fill="${K.blue2}" opacity="0.35"/>
    <path d="M745 148 a18 18 0 0 1 18 -18 H917 a18 18 0 0 1 18 18 V186 H745 Z" fill="${K.pink4}"/>
    <rect x="785" y="106" width="12" height="42" rx="6" fill="${K.purple5}"/>
    <rect x="883" y="106" width="12" height="42" rx="6" fill="${K.purple5}"/>
    ${[0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) =>
      `<circle cx="${778 + c * 46}" cy="${220 + r * 40}" r="11" fill="${r === 1 && c === 2 ? K.yellow3 : K.blue2}"/>`)).join('\n    ')}
    <circle cx="870" cy="260" r="19" fill="none" stroke="${K.orange4}" stroke-width="5"/>

    <!-- a pin where the path ends -->
    <path d="M845 462 c-4 -32 -34 -46 -34 -76 a34 34 0 0 1 68 0 c0 30 -30 44 -34 76 z" fill="${K.green3}" transform="translate(52 -28) scale(.8)"/>
    <circle cx="897" cy="381" r="12" fill="${K.white}"/>

    <!-- the route -->
    ${dots.join('\n    ')}

    <!-- confetti and Memphis shapes -->
    <polygon points="330,60 360,110 300,110" fill="${K.yellow3}"/>
    <polygon points="740,40 770,92 712,92" fill="${K.purple3}"/>
    <circle cx="300" cy="190" r="14" fill="${K.pink3}"/>
    <circle cx="690" cy="400" r="12" fill="${K.blue3}"/>
    <circle cx="960" cy="60" r="18" fill="${K.orange3}"/>
    <rect x="12" y="120" width="38" height="38" rx="4" fill="${K.teal3}" transform="rotate(18 31 139)"/>
    <polygon points="650,246 676,206 702,246" fill="${K.pink4}"/>
    <rect x="296" y="290" width="26" height="26" fill="${K.purple4}" transform="rotate(20 309 303)"/>
    <rect x="960" y="250" width="20" height="20" fill="${K.yellow4}" transform="rotate(30 970 260)"/>
  </g>
  <rect width="${w}" height="${h}" filter="url(#grain)" style="mix-blend-mode:multiply" opacity="0.14"/>
</svg>`;
}

const sizes = [
  { w: 1600, h: 600, out: join(here, '..', 'public', 'art', 'about-pam.webp'), type: 'image/webp' },
  { w: 1200, h: 630, out: join(here, '..', 'public', 'og', 'about-pam.png'), type: 'image/png' },
];

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
for (const { w, h, out, type } of sizes) {
  const svg = scene(w, h);
  if (process.env.KEEP_SVG) writeFileSync(out.replace(/\.\w+$/, '.svg'), svg);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<style>*{margin:0}body{width:${w}px;height:${h}px;overflow:hidden}</style>${svg}`);
  const b64 = await page.evaluate(
    async ({ svg, w, h, type }) => {
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      await img.decode();
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL(type, 0.9).split(',')[1];
    },
    { svg, w, h, type },
  );
  writeFileSync(out, Buffer.from(b64, 'base64'));
  await page.close();
}
await browser.close();
