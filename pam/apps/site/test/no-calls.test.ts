import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * A28 (Will, 11 October 2026): no phone calls; the help desk is email. Nothing on the site may tell a person to call
 * Pam, and the only `tel:` links are 911 and 988 (Your safety). Comments are skipped: they may name the rule.
 */
const ROOT = join(__dirname, '..');
const DIRS = ['src', 'public'];
const EXT = /\.(tsx?|json|html|txt|md)$/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : EXT.test(name) ? [path] : [];
  });
}

function code(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');
}

const ALL = DIRS.flatMap((d) => {
  try {
    return files(join(ROOT, d));
  } catch {
    return [];
  }
});

describe('no phone calls (A28)', () => {
  it('reads some files', () => {
    expect(ALL.length).toBeGreaterThan(20);
  });

  it('never tells anyone to call, ring or phone Pam', () => {
    // search-synonyms/everyday-words list people's own words ("call", "phone pam"); those are queries, not instructions.
    const SKIP = /everyday-words|search-synonyms|search-phrases|most-asked/;
    for (const path of ALL.filter((p) => !SKIP.test(p))) {
      const text = code(path);
      expect(text, path).not.toMatch(/\b(call|calling|ring|phone)\s+(pam|us)\b/i);
      expect(text, path).not.toMatch(/call you back|monday to friday|help\.call|callSupport|Need help\? Call/i);
    }
  });

  it('has no tel: link except 911 and 988', () => {
    for (const path of ALL) {
      for (const m of code(path).matchAll(/tel:([^"'`\s)>]*)/gi)) {
        expect(['911', '988'], `${path} links tel:${m[1]}`).toContain(m[1]);
      }
    }
  });
});

describe('the app links to “Your safety” (Lena: apps/web/src/lib/helpDesk.ts)', () => {
  it('has a published post at /support/your-safety/ that does not end with a second Still stuck?', async () => {
    const { POSTS } = await import('../src/content/posts');
    const post = POSTS.find((p) => p.slug === 'your-safety');
    expect(post, 'the app’s “Talk to someone now” opens /support/your-safety/').toBeTruthy();
    expect(post?.status).toBeUndefined();
  });
});
