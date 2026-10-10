import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Invite links in texts and emails read `joinpam.org/j/<CODE>` (10 October, Mira, from
 * Will). The site is the bare domain and the app is `app.joinpam.org`, so the site
 * forwards `/j/:code` to the app. The site is a static export, so the forward lives in
 * `vercel.json`, which Vercel applies and a local build does not: this test reads the
 * rules and matches real-looking invite paths against them, the way Vercel's `:param`
 * patterns work, and checks the built output holds no page that could stand in the way.
 */
const root = join(__dirname, '..');
const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')) as {
  redirects: { source: string; destination: string; permanent?: boolean }[];
};

/** A path against a Vercel source pattern with `:name` segments; returns the params, or null. */
function match(source: string, path: string): Record<string, string> | null {
  const names: string[] = [];
  const re = new RegExp(
    '^' + source.replace(/:([a-zA-Z]+)/g, (_, n: string) => (names.push(n), '([^/]+)')) + '$',
  );
  const m = re.exec(path);
  return m ? Object.fromEntries(names.map((n, i) => [n, m[i + 1] as string])) : null;
}

function redirect(path: string): string | null {
  for (const r of config.redirects) {
    const params = match(r.source, path);
    if (params) return r.destination.replace(/:([a-zA-Z]+)/g, (_, n: string) => params[n] ?? '');
  }
  return null;
}

describe('invite links on joinpam.org', () => {
  // The kinds of code Pam gives out: letters and digits, any case.
  for (const code of ['K7M2XQ', 'abc123', 'A1B2C3D4E5']) {
    it(`forwards /j/${code} to the app, with and without the trailing slash`, () => {
      expect(redirect(`/j/${code}`)).toBe(`https://app.joinpam.org/j/${code}`);
      expect(redirect(`/j/${code}/`)).toBe(`https://app.joinpam.org/j/${code}`);
    });
  }

  it('forwards nothing else', () => {
    for (const path of ['/', '/support/', '/support/case-manager-assignments/', '/j', '/j/']) {
      expect(redirect(path), path).toBeNull();
    }
  });

  it('is a temporary redirect, so the destination can change', () => {
    for (const r of config.redirects) expect(r.permanent).toBe(false);
  });

  it('has no page of its own at /j in the built site to stand in the way', () => {
    const out = join(root, 'out');
    if (!existsSync(out)) return; // not built yet: CI builds the site after the unit tests
    expect(existsSync(join(out, 'j'))).toBe(false);
    expect(existsSync(join(out, 'j.html'))).toBe(false);
  });
});
