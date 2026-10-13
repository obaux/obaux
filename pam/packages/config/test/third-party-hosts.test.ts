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
 *
 * The edge functions are scanned too (a67 follow-up, Mira, 11 October): what Pam's SERVER sends to another company on a member's
 * behalf is "who else gets your information" as much as what the page loads. Each function is listed with the outside hosts it
 * reaches (`FUNCTIONS`), each such host is a `server` entry whose Privacy line must name the company, and a new function that
 * makes requests, or a new host in one, fails until it is listed. A host Privacy does not name yet is entered `pending` (its
 * card) and is reported to the merge desk, which puts the missing line in front of Will.
 */
const ROOTS = [
  { dir: '../../../apps/web', skip: ['node_modules', '.next', 'out', 'storybook-static', 'test-results', 'user-flows-out', 'e2e', 'stories', 'public', 'scripts'] },
  { dir: '../../ui/src', skip: ['stories'] },
  // The public website, joinpam.org: "the only part of Pam that your phone loads from Google" (sharing.p5) covers it too.
  { dir: '../../../apps/site', skip: ['node_modules', '.next', 'out', 'public', 'scripts', 'social', 'test', 'screenshots.json'] },
  { dir: '../src', skip: ['locales'] },
  // What Pam's server sends on a member's behalf (texts, email, translation, link previews; later Google).
  { dir: '../../../supabase/functions', skip: ['node_modules'] },
] as const;

const REPO = fileURLToPath(new URL('../../../', import.meta.url));

function sources(dir: string, skip: readonly string[]): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return skip.includes(name) ? [] : sources(path, skip);
    return /\.(tsx?|mjs|js|json|css)$/.test(name) && !/\.(test|spec)\.|\.d\.ts$|tsbuildinfo|package\.json$|^(playwright|vitest)\.config\./.test(name) ? [path] : [];
  });
}

type Kind = 'own' | 'link' | 'loaded' | 'server' | 'example' | 'text';

interface HostEntry {
  readonly kind: Kind;
  readonly why: string;
  /** For a host the app loads: the Privacy line that names the company, and the word it must contain. */
  readonly privacy?: { readonly key: string; readonly names: RegExp };
  /** Privacy's line waits on a card; until the key exists in English the check is skipped, then it applies. */
  readonly pending?: string;
  /** Going away in this decision; not an error if the sources no longer name it. */
  readonly removing?: string;
  /** Not in the sources yet: a branch that has not landed. Allowed to be absent; the checks apply once it is there. */
  readonly arriving?: string;
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

  // Called by Pam's server on a member's behalf: the company gets what the server sends it.
  'api.twilio.com': {
    kind: 'server',
    why: 'texts: the number and the words of each text (dispatch-sms)',
    privacy: { key: 'privacy.s.sharing.p3', names: /the one that sends our texts/ },
  },
  'api.resend.com': {
    kind: 'server',
    why: 'email: the address and the email (send-invite-emails, help-request)',
    privacy: { key: 'privacy.s.sharing.p4', names: /a company that sends email for us/ },
  },
  'api.anthropic.com': {
    kind: 'server',
    why: 'translating a message: the words of that message and nothing else (translate-messages)',
    privacy: { key: 'privacy.s.translation.p2', names: /Claude, an AI made by Anthropic/ },
  },
  'accounts.google.com': {
    kind: 'server',
    why: 'Google sign-in for the calendar sync: the member is sent there to allow it (google-calendar, D-539)',
    privacy: { key: 'privacy.s.sharing.p7', names: /Google/ },
    pending: 'the Google sync card (merged with GOOGLE_SYNC_LIVE)',
    arriving: 'D-539',
  },
  'oauth2.googleapis.com': {
    kind: 'server',
    why: 'the sealed key to the “Pam visits” calendar: exchange, refresh and revoke (google-calendar, D-539)',
    privacy: { key: 'privacy.s.sharing.p7', names: /Google/ },
    pending: 'the Google sync card (merged with GOOGLE_SYNC_LIVE)',
    arriving: 'D-539',
  },
  'www.googleapis.com': {
    kind: 'server',
    why: 'the “Pam visits” calendar and its events: the visits (google-calendar, D-539)',
    privacy: { key: 'privacy.s.sharing.p7', names: /Google/ },
    pending: 'the Google sync card (merged with GOOGLE_SYNC_LIVE)',
    arriving: 'D-539',
  },

  // Links a person taps: they leave Pam.
  'www.google.com': { kind: 'link', why: 'directions and search on Google Maps, opened by a tap (PlaceCard.tsx)' },
  'maps.apple.com': { kind: 'link', why: 'directions in Apple Maps, opened by a tap (PlaceCard.tsx)' },
  'play.google.com': { kind: 'link', why: 'Google Maps in the Play Store, opened by a tap (mapsLaunch.ts)' },
  'apps.apple.com': { kind: 'link', why: 'Google Maps in the App Store, opened by a tap (mapsLaunch.ts)' },
  'github.com': { kind: 'link', why: 'the neighborhood data’s source, linked under Legal › Data sources (LegalView.tsx, D-540)' },
  'creativecommons.org': { kind: 'link', why: 'the CC BY 4.0 licence of that data, linked under Legal › Data sources (LegalView.tsx, D-540)' },

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
/**
 * The edge functions that make requests, and the outside hosts each reaches (the database is Pam's own). `dynamic` is a function that
 * fetches an address a member gave it, so no host is written in its code: Privacy must say so.
 */
interface FunctionEntry {
  readonly reaches: readonly string[];
  readonly why: string;
  readonly dynamic?: { readonly privacy: { readonly key: string; readonly names: RegExp } };
  readonly arriving?: string;
}
const FUNCTIONS: Record<string, FunctionEntry> = {
  'dispatch-sms': { reaches: ['api.twilio.com'], why: 'sends the texts' },
  'sms-inbound': { reaches: [], why: 'Twilio calls it with a reply; it asks only Pam’s own database' },
  'send-invite-emails': { reaches: ['api.resend.com'], why: 'sends the invite email' },
  'help-request': { reaches: ['api.resend.com'], why: 'forwards a help request by email, behind a switch' },
  'translate-messages': { reaches: ['api.anthropic.com'], why: 'translates a message the member asked to read in their language' },
  'link-preview': {
    reaches: [],
    why: 'opens the page of a link a member sent, once, for its title and picture',
    dynamic: { privacy: { key: 'privacy.s.what-we-keep.p6', names: /server opens the page once/ } },
  },
  'calendar-feed': { reaches: [], why: 'serves the calendar link; asks only Pam’s own database', arriving: 'D-538' },
  'google-calendar': {
    reaches: ['accounts.google.com', 'oauth2.googleapis.com', 'www.googleapis.com'],
    why: 'keeps the “Pam visits” calendar in the member’s Google account',
    arriving: 'D-539',
  },
};
const FUNCTIONS_DIR = 'supabase/functions/';
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
      .filter(([host, entry]) => !named.has(host) && !entry.removing && !entry.arriving)
      .map(([host]) => host);
    expect(gone, 'No source names these any more: delete them from HOSTS.').toEqual([]);
  });

  it('has Privacy name every company the page loads from', () => {
    for (const [host, entry] of Object.entries(HOSTS)) {
      if ((entry.kind !== 'loaded' && entry.kind !== 'server') || entry.removing) continue;
      const { privacy } = entry;
      expect(privacy, `${host} is reached by the app or its server: give it a Privacy line (key and the company’s name)`).toBeDefined();
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
      .filter(({ path, text }) => REQUESTS.test(text) && !path.endsWith('.json') && !path.endsWith('.css') && !path.startsWith('supabase/functions/'))
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
  describe('the edge functions (what Pam’s server sends on a member’s behalf)', () => {
    const inFunction = (name: string) => files.filter(({ path }) => path.startsWith(`${FUNCTIONS_DIR}${name}/`));
    const makingRequests = [...new Set(files.filter(({ path, text }) => path.startsWith(FUNCTIONS_DIR) && /\bfetch\(|\bfetch:/.test(text)).map(({ path }) => path.split('/')[2]!))];

    it('lists every function that makes requests', () => {
      const unlisted = makingRequests.filter((name) => !(name in FUNCTIONS));
      expect(unlisted, 'A new edge function that makes requests. Add it to FUNCTIONS with the outside hosts it reaches (and each host to HOSTS as a server entry with a Privacy line).').toEqual([]);
    });

    it('lists no function that is gone, unless it has not landed yet', () => {
      const gone = Object.entries(FUNCTIONS)
        .filter(([name, entry]) => !entry.arriving && inFunction(name).length === 0)
        .map(([name]) => name);
      expect(gone).toEqual([]);
    });

    it('reaches only the hosts it lists, and every one it lists is in its code', () => {
      for (const [name, entry] of Object.entries(FUNCTIONS)) {
        const code = inFunction(name);
        if (entry.arriving && code.length === 0) continue;
        const outside = new Set(
          code.flatMap(({ text }) => [...text.matchAll(/https?:\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi)].map((m) => m[1]!.toLowerCase())).filter((h) => HOSTS[h]?.kind === 'server'),
        );
        expect([...outside].sort(), `${name} reaches these outside hosts`).toEqual([...entry.reaches].sort());
        for (const host of entry.reaches) expect(HOSTS[host]?.kind, `${host} (${name}) is a server entry in HOSTS`).toBe('server');
      }
    });

    it('says in Privacy what a function that fetches a member’s link does', () => {
      for (const [name, entry] of Object.entries(FUNCTIONS)) {
        if (!entry.dynamic) continue;
        const words = EN[entry.dynamic.privacy.key];
        expect(words, `${name} fetches an address a member gave it: ${entry.dynamic.privacy.key} must say so`).toBeDefined();
        expect(words).toMatch(entry.dynamic.privacy.names);
      }
    });

    it('has Privacy line for every outside company a live function reaches, or says which card it waits on', () => {
      const waiting = Object.entries(HOSTS)
        .filter(([, entry]) => entry.kind === 'server' && entry.privacy && EN[entry.privacy.key] === undefined)
        .map(([host, entry]) => `${host} waits on ${entry.pending ?? 'a Privacy line nobody has written'}`);
      // Not a failure while a card is named: the merge desk is told (docs/before-launch.md, “Google sync”). Without a card it is.
      const nobody = waiting.filter((line) => line.endsWith('nobody has written'));
      expect(nobody, 'A live server host Privacy does not name, and no card to say it.').toEqual([]);
    });
  });
});
