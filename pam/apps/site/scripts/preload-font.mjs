// After `next build`: tell every page to fetch the main Figtree file straight away (Iris's finding W3, 11 October).
// The font is `font-display: swap` (packages/ui/src/styles/fonts.css), so a page first paints in the fallback face and
// then jumps when Figtree arrives: a post's title and sections shifted by 0.23 at ~200ms on a cold load. A preload starts
// the download with the HTML instead of after the CSS, so the swap lands before the first paint. The file's name has a
// hash, so it is read from the build, not written by hand.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
const media = join(out, '_next', 'static', 'media');
const file = existsSync(media) ? readdirSync(media).find((f) => /^figtree-latin\.[^.]+\.woff2$/.test(f)) : undefined;
if (!file) {
  console.error('preload-font: no figtree-latin file in out/_next/static/media; nothing preloaded');
  process.exit(1);
}
const tag = `<link rel="preload" href="/_next/static/media/${file}" as="font" type="font/woff2" crossorigin="anonymous"/>`;

let done = 0;
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '_next') walk(path);
    } else if (entry.name.endsWith('.html')) {
      const html = readFileSync(path, 'utf8');
      if (html.includes(tag) || !html.includes('</head>')) continue;
      writeFileSync(path, html.replace('</head>', `${tag}</head>`));
      done += 1;
    }
  }
};
walk(out);
console.log(`preload-font: ${file} preloaded in ${done} pages`);
