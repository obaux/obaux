import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BRAND, PHOTOGRAPHS } from './imagery';

const PUBLIC = join(__dirname, '../../../public');
const IMAGE = /\.(webp|jpe?g|png|svg|gif|avif)$/i;

function images(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return images(path);
    return IMAGE.test(name) ? [`/${relative(PUBLIC, path).split('\\').join('/')}`] : [];
  });
}

describe('Foundations › Imagery', () => {
  const listed = new Set([...PHOTOGRAPHS, ...BRAND].flatMap((item) => [item.src, ...(item.alsoAt ?? [])]));

  it('lists every image in apps/web/public', () => {
    const missing = images(PUBLIC).filter((src) => !listed.has(src));
    expect(missing, 'add these to stories/foundations/imagery.ts').toEqual([]);
  });

  it('lists nothing that is not there', () => {
    const present = new Set(images(PUBLIC));
    expect([...listed].filter((src) => !present.has(src))).toEqual([]);
  });
});
