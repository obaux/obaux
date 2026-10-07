// Compresses the Bring a friend banner for production (D-337).
//
//   node scripts/friend-banner.mjs <source image>
//
// sharp comes with Next (it is in the workspace's node_modules).
//
// Writes public/friend/bring-a-friend-800.webp and -1200.webp: resized to
// those widths, metadata stripped, WebP at quality 74 with smart subsampling
// (the picture is flat colour with sharp edges, which WebP keeps clean at a
// fraction of a JPEG's size). Prints each file's size.
import { mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = process.argv[2];
if (!source) {
  console.error('usage: node scripts/friend-banner.mjs <source image>');
  process.exit(1);
}
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'friend');
mkdirSync(out, { recursive: true });

for (const width of [800, 1200]) {
  const file = join(out, `bring-a-friend-${width}.webp`);
  await sharp(source)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 74, effort: 6, smartSubsample: true })
    .toFile(file);
  console.log(`${file}: ${Math.round(statSync(file).size / 1024)} KB`);
}
