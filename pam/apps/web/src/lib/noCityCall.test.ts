import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * What a member types into the area search goes to Pam's own database and nowhere
 * else (D-536). The browser used to ask the City of Philadelphia's property API
 * about anything that began like a street address, so the City saw a part-typed
 * address and the phone's IP address. No app source may name that host again.
 */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'stories' ? [] : sources(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe('the area search', () => {
  it('names no host of the City in any app source', () => {
    const offenders = sources(join(__dirname, '..')).filter((file) => /carto\.com|phl\.carto/i.test(readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')));
    expect(offenders).toEqual([]);
  });

  it('asks only Pam\'s search_areas', () => {
    const source = readFileSync(join(__dirname, 'useAreaSearch.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(source).not.toMatch(/fetch\(/);
    expect(source).toContain("rpc('search_areas'");
  });
});
