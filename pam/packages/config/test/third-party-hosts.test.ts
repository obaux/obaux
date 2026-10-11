import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';

/**
 * Every outside company the app's code can reach, and what Privacy says about it (a67, Mira, 11 October 2026).
 *
 * Privacy says who else gets a member's information. The honest version of that is a list a test can hold:
 * every host the app's sources name is here, with why. A host the app *loads* (a script, a fetch, an image the
 * page asks for) gets the phone's IP address at least, so Privacy must name it; a host that is only a link a person
 * taps (Apple Maps, the app stores) is a place they leave Pam for, as with the Google Docs link in
 * `privacy.s.what-we-keep.p5`; Pam's own hosts are "the one that stores our data" (`privacy.s.sharing.p3`).
 *
 * It fails when
 *   - a source names a host that is not in the table (a new service: decide what it is, and tell Privacy first);
 *   - a file starts to make requests of its own (`fetch`, a script's `src`, an iframe) that is not listed; or
 *   - a table entry is no longer in the sources (delete it), unless it says it is being removed.
 *
 * It does not see a host built at run time (`https://${host}`); the second check is what catches a new way to load one.
 */
const ROOTS = [
  { dir: '../../../apps/web', skip: ['node_modules', '.next', 'out', 'storybook-static', 'test-results', 'user-flows-out', 'e2e', 'stories', 'public', 'scripts'] },
  { dir: '../../ui/src', skip: ['stories'] },
  // The public website, joinpam.org: "the only part of Pam that your phone loads from Google" (sharing.p5) covers it too.
  { dir: '../../../apps/site', skip: ['node_modules', '.next', 'out', 'public', 'scripts', 'social', 'test', 'screenshots.json'] },
  { dir: '../src', skip: ['locales'] },
] as const;

const REPO = fileURLToPath(new URL('../../../', import.meta.url));

function sources(dir: string, skip: readonly string[]): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return skip.includes(name) ? [] : sources(path, skip);
    return /\.(tsx?|mjs|js|json|css)$/.test(name) && !/\.(test|spec)\.|\.d\.ts$|tsbuildinfo|package\.json$|^(playwright|vitest)\.config\./.test(name) ? [path] : [];
  });
}

type Kind = 'own' | 'link' | 'loaded' | 'example' | 'text';

interface HostEntry {
  readonly kind: Kind;
  readonly why: string;
  /** For a host the app loads: the Privacy line that names the company, and the word it must contain. */
  readonly privacy?: { readonly key: string; readonly names: RegExp };
  /** Privacy's line waits on a card; until the key exists in English the check is skipped, then it applies. */
  readonly pending?: string;
  /** Going away in this decision; not an error if the sources no longer name it. */
  readonly removing?: string;
}

const HOSTS: Record<string, HostEntry> = {
  // Pam's own.
  'shobqzuhicoiymtumiaz.supabase.co': { kind: 'own', why: 'the database and sign-in: “the one that stores our data” (privacy.s.sharing.p3)' },
  'joinpam.org': { kind: 'own', why: 'the public site and its help desk' },
  'app.joinpam.org': { kind: 'own', why: 'the app' },
  'www.joinpam.org': { kind: 'own', why: 'the public site, with www' },

  // Loaded by the page: the company gets the phone’s IP address.
  'maps.googleapis.com': {
    kind: 'loaded',
    why: 'the Trips map: Google’s Maps script and tiles (TripsMap.tsx, only where a key is set)',
    privacy: { key: 'privacy.s.sharing.p5', names: /Google/ },
    pending: 'a67',
  },

  // Links a person taps: they leave Pam.
  'www.google.com': { kind: 'link', why: 'directions and search on Google Maps, opened by a tap (PlaceCard.tsx)' },
  'maps.apple.com': { kind: 'link', why: 'directions in Apple Maps, opened by a tap (PlaceCard.tsx)' },
  'play.google.com': { kind: 'link', why: 'Google Maps in the Play Store, opened by a tap (mapsLaunch.ts)' },
  'apps.apple.com': { kind: 'link', why: 'Google Maps in the App Store, opened by a tap (mapsLaunch.ts)' },

  // Example people only (a real account sees no examples: lib/examples.ts).
  'images.unsplash.com': { kind: 'example', why: 'stock photos of the example staff in dummy-connections.ts; shown only while examples are on' },

  // Not a request: a namespace, a comment, a placeholder, a schema.
  'www.w3.org': { kind: 'text', why: 'SVG xmlns' },
  'example.org': { kind: 'text', why: 'placeholder address in examples' },
  'www.example.org': { kind: 'text', why: 'placeholder address in examples' },
  'openapi.vercel.sh': { kind: 'text', why: 'the $schema line of vercel.json' },
  'fonts.googleapis.com': { kind: 'text', why: 'in theme.template.ts’s comment only: the fonts are self-hosted (packages/ui/src/styles/fonts.css)' },
  'fonts.gstatic.com': { kind: 'text', why: 'in theme.template.ts’s comment only: the fonts are self-hosted (packages/ui/src/styles/fonts.css)' },
};

/** Files that ask for something themselves. Anything else that starts to must be added here, and its host above. */
const REQUESTERS: Record<string, string> = {
  'apps/web/src/screens/TripsMap.tsx': 'the Google Maps script (maps.googleapis.com)',
  'packages/ui/src/OnboardingSlides.tsx': 'preloads the slide pictures, which are Pam’s own',
  'apps/site/src/components/HelpRequest.tsx': 'the help form posts to Pam’s own database function (the Supabase host), behind a switch that is off (D-521)',
};
const REQUESTS = /\bfetch\(|\.src\s*=|<iframe|new\s+Image\(|sendBeacon\(|new\s+WebSocket\(|new\s+EventSource\(|<script[\s>]|@import\s+url\(/;

describe('who else the app talks to (a67)', () => {
  const files = ROOTS.flatMap(({ dir, skip }) => sources(fileURLToPath(new URL(dir, import.meta.url)), skip)).map((path) => ({
    path: relative(REPO, path),
    text: readFileSync(path, 'utf8'),
  }));
  const named = new Map<string, string[]>();
  for (const { path, text } of files) {
    for (const m of text.matchAll(/https?:\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi)) {
      const host = m[1]!.toLowerCase();
      named.set(host, [...(named.get(host) ?? []), path]);
    }
  }

  it('reads the app’s sources', () => {
    expect(files.length).toBeGreaterThan(200);
    expect(named.has('shobqzuhicoiymtumiaz.supabase.co')).toBe(true);
  });

  it('knows every host the sources name', () => {
    const unknown = [...named.entries()]
      .filter(([host]) => !(host in HOSTS))
      .map(([host, where]) => `${host} (${[...new Set(where)].join(', ')})`);
    expect(
      unknown,
      'A new host. Say what it is in HOSTS: loaded (it gets the phone’s IP address, so Privacy names it and Will signs the line first), a link a person taps, Pam’s own, or not a request at all.',
    ).toEqual([]);
  });

  it('has nothing in the table that the sources no longer name, unless it is being removed', () => {
    const gone = Object.entries(HOSTS)
      .filter(([host, entry]) => !named.has(host) && !entry.removing)
      .map(([host]) => host);
    expect(gone, 'No source names these any more: delete them from HOSTS.').toEqual([]);
  });

  it('has Privacy name every company the page loads from', () => {
    for (const [host, entry] of Object.entries(HOSTS)) {
      if (entry.kind !== 'loaded' || entry.removing) continue;
      const { privacy } = entry;
      expect(privacy, `${host} is loaded by the app: give it a Privacy line (key and the company’s name)`).toBeDefined();
      const words = EN[privacy!.key];
      if (words === undefined && entry.pending) continue; // the line waits on card ${entry.pending}; it applies the day it lands
      expect(words, `${privacy!.key} (Privacy’s line for ${host}) does not exist`).toBeDefined();
      expect(words, `${privacy!.key} must name the company that ${host} belongs to`).toMatch(privacy!.names);
    }
  });

  it('keeps the Maps script the only thing Pam loads from Google', () => {
    // privacy.s.sharing.p5 (a67): “The map is the only part of Pam that your phone loads from Google.” A Google font, a
    // sign-in, an analytics tag or a second Maps host would make that false: tell Privacy first.
    const google = Object.entries(HOSTS)
      .filter(([host, entry]) => /google|gstatic|googleusercontent|doubleclick/.test(host) && entry.kind === 'loaded')
      .map(([host]) => host);
    expect(google).toEqual(['maps.googleapis.com']);
    const sayingIt = EN['privacy.s.sharing.p5'];
    if (sayingIt) expect(sayingIt).toMatch(/only part of Pam that your phone loads from Google/);
  });

  it('lists every file that makes requests of its own', () => {
    const doing = files
      .filter(({ path, text }) => REQUESTS.test(text) && !path.endsWith('.json') && !path.endsWith('.css'))
      .map(({ path }) => path)
      .filter((path) => !(path in REQUESTERS));
    expect(
      doing,
      'These files fetch, load a script or an image, or open a frame. Add them to REQUESTERS with what they reach (and its host to HOSTS).',
    ).toEqual([]);
  });

  it('does not list a file that is gone or no longer asks for anything, unless its removal is already named', () => {
    const missing = Object.keys(REQUESTERS).filter((path) => !existsSync(join(REPO, path)) && !REQUESTERS[path]!.includes('going away'));
    expect(missing).toEqual([]);
  });
});
