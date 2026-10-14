import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import { PRIVACY } from '../src/legal.js';

/**
 * Privacy on the street-address search (a74, Piper's `places-search`; Lena, 13 October 2026).
 *
 * A member who types a street address, a corner, or anything Pam's own list of areas does not have gets suggestions from Google
 * Places. Pam's SERVER asks Google, not the phone, so what Google receives is only what the function sends. The Privacy line
 * (`privacy.s.sharing.p7`) promises four things about that, and each is a property of the function's code that a test can hold:
 *
 *   1. what the member typed travels in the body of a POST, never in a URL (the gateway logs every URL, a66);
 *   2. nothing the member typed or Google answered is written to a log (the only `console` calls carry fixed words);
 *   3. Google is sent the words, the place picked and a random one-search code, and no member id, phone, name, email, token or
 *      client address, and only to places.googleapis.com;
 *   4. Pam stores neither the words nor the answer (no write to the database, no cache, no key-value store).
 *
 * The checks are one function over the source (`problemsIn`), tried here on a sample that is right and on one sample per way
 * of being wrong, so each rule is known to be able to fail. The same function is then run on the real file once it is on the
 * branch (`supabase/functions/places-search/index.ts`); until then that half is skipped and this file says so. The host guard
 * (`third-party-hosts.test.ts`) holds the host and that Privacy names Google.
 *
 * The line itself is checked here too, from the day Will signs it and it is in the bundles.
 */
const FUNCTION = fileURLToPath(new URL('../../../supabase/functions/places-search/index.ts', import.meta.url));
// The function is its wiring (index.ts) and its handler (handler.ts, with everything it touches passed in): the promises are held to both together.
const HANDLER = fileURLToPath(new URL('../../../supabase/functions/places-search/handler.ts', import.meta.url));

/** The text between a bracket at `open` and its partner, brackets and quotes balanced; '' if it never closes. */
function between(source: string, open: number): string {
  const pairs: Record<string, string> = { '(': ')', '{': '}', '[': ']' };
  const stack: string[] = [];
  let quote = '';
  for (let i = open; i < source.length; i++) {
    const c = source[i]!;
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c in pairs) stack.push(pairs[c]!);
    else if (stack.length && c === stack[stack.length - 1]) {
      stack.pop();
      if (!stack.length) return source.slice(open + 1, i);
    }
  }
  return '';
}

const GOOGLE_HOST = 'places.googleapis.com';
/** The headers Pam may send Google: the content type, its own server key and the field mask (location and address only). */
const GOOGLE_HEADERS = new Set(['content-type', 'x-goog-api-key', 'x-goog-fieldmask']);
/** Words that would mean something about the member is in a request to Google. */
const IDENTITY = /\b(user_?id|member_?id|profile_?id|phone|email|first_?name|last_?name|jwt|access_?token|authorization|bearer|x-forwarded-for|x-real-ip|cf-connecting-ip|true-client-ip|forwarded)\b/i;

function problemsIn(source: string): string[] {
  const problems: string[] = [];

  // 1. Typed text arrives in a POST body, never in the URL.
  if (!/\.json\(\)|JSON\.parse\(/.test(source)) problems.push('the function never reads a JSON body: what is typed must come in a POST body');
  // The member's own request, not the POST the function makes to Google: `req.method` is compared with POST.
  if (!/\breq(uest)?\.method\s*[!=]==?\s*['"]POST['"]/.test(source)) problems.push('the function does not insist on POST');
  if (/\breq(uest)?\.url\b|\bsearchParams\b|new URL\(\s*req/.test(source)) problems.push('the function reads the request URL or its query string: typed text must not travel in a URL');

  // 2. Nothing typed or answered reaches a log: every console call is a fixed sentence, optionally with a status.
  for (const m of source.matchAll(/\bconsole\s*\.\s*\w+\s*\(/g)) {
    const args = between(source, m.index! + m[0].length - 1).trim();
    const fixed = /^(['"`])[^'"`$\\]*\1\s*(,\s*[\w.]*status[\w.]*)?$/i.test(args);
    if (!fixed) problems.push(`a log line carries more than a fixed sentence and a status: ${m[0]}${args.slice(0, 40)}…)`);
  }

  // 3. Only Google's Places host and paths; only the headers listed; nothing about the member in the request.
  for (const m of source.matchAll(/https?:\/\/([a-z0-9.-]+)([^\s'"`)]*)/gi)) {
    if (m[1]!.toLowerCase() !== GOOGLE_HOST) problems.push(`names a host that is not ${GOOGLE_HOST}: ${m[1]}`);
    else if (!/^\/v1\/places(:autocomplete|\/|\?|$)/.test(m[2]!)) problems.push(`reaches a Google path other than autocomplete and place details: ${m[2]}`);
  }
  for (const m of source.matchAll(/\bfetch\s*\(/g)) {
    const call = between(source, m.index! + m[0].length - 1);
    // Every call but one is held to the rules below: the exception is the function asking Pam's own database who is signed in, with
    // the member's own sign-in (`/auth/v1/user`). Naming the exception, not "the calls that go to Google", means a Google call whose
    // address sits in a variable is inspected too.
    if (/\/auth\/v1\/user/.test(call)) continue;
    const at = call.search(/\bheaders\s*:/);
    if (at < 0) continue;
    const open = call.indexOf('{', at);
    const headers = open < 0 ? '' : between(call, open);
    for (const key of headers.matchAll(/(?:^|[,{\s])['"]?([A-Za-z][A-Za-z0-9-]*)['"]?\s*:/g)) {
      if (!GOOGLE_HEADERS.has(key[1]!.toLowerCase())) problems.push(`sends Google a header it should not: ${key[1]}`);
    }
    if (IDENTITY.test(call)) problems.push(`a request to Google mentions something about the member: ${call.match(IDENTITY)![0]}`);
  }

  // 4. Signed in only, and nothing is stored.
  if (!(/\.getUser\s*\(/.test(source) || /\/auth\/v1\/user/.test(source)) || !/\b401\b/.test(source)) problems.push('the function does not turn away a request with no signed-in member (getUser and a 401)');
  if (/\.(insert|upsert|update|delete)\s*\(|\.rpc\s*\(|Deno\.(openKv|writeFile|writeTextFile)|\bcaches\s*\./.test(source)) {
    problems.push('the function writes something somewhere: it must store neither the words nor the answer');
  }
  return problems;
}

/** A function that keeps every promise in the line, in the shape Piper described (13 October). */
const RIGHT = `
import { createClient } from 'npm:@supabase/supabase-js@2';
const BOX = { low: { latitude: 39.86, longitude: -75.28 }, high: { latitude: 40.14, longitude: -74.95 } };
Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return new Response('Sign in first', { status: 401 });
  const { text, token, placeId } = await req.json();
  const key = Deno.env.get('GOOGLE_MAPS_SERVER_KEY');
  if (!key) return new Response('{}', { status: 503 });
  const res = placeId
    ? await fetch(\`https://places.googleapis.com/v1/places/\${encodeURIComponent(placeId)}?sessionToken=\${token}\`, {
        headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'location,formattedAddress' },
      })
    : await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
        body: JSON.stringify({ input: text, sessionToken: token, locationRestriction: { rectangle: BOX } }),
      });
  if (!res.ok) console.error('places-search: Google did not answer', res.status);
  return new Response(await res.text(), { status: res.status });
});
`;

const WRONG: Record<string, [string, RegExp]> = {
  'reads the typed words from the query string': [RIGHT.replace('const { text, token, placeId } = await req.json();', "const q = new URL(req.url).searchParams; const { text, token, placeId } = { text: q.get('q'), token: q.get('t'), placeId: q.get('p') }; await req.json();"), /request URL|query string/],
  'logs what was typed': [RIGHT.replace("console.error('places-search: Google did not answer', res.status);", 'console.log(text);'), /log line/],
  'logs the answer in a template': [RIGHT.replace("console.error('places-search: Google did not answer', res.status);", 'console.error(`google said ${await res.text()}`);'), /log line/],
  'sends Google the phone’s address': [RIGHT.replace("'Content-Type': 'application/json', 'X-Goog-Api-Key': key", "'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Forwarded-For': req.headers.get('x-forwarded-for') ?? ''"), /header it should not|something about the member/],
  'sends Google the member’s sign-in token': [RIGHT.replace("'X-Goog-FieldMask': 'location,formattedAddress'", "'X-Goog-FieldMask': 'location,formattedAddress', Authorization: req.headers.get('Authorization') ?? ''"), /header it should not|something about the member/],
  'sends Google the member’s id in the body': [RIGHT.replace('input: text,', 'input: text, userId: data.user.id,'), /something about the member/],
  'reaches a second company': [RIGHT.replace("if (!res.ok)", "await fetch('https://api.example.com/log'); if (!res.ok)"), /not places\.googleapis\.com/],
  'reaches another Google path': [RIGHT.replace('/v1/places:autocomplete', '/v1/places:searchText'), /other than autocomplete/],
  'answers a request with no one signed in': [RIGHT.replace("if (!data.user) return new Response('Sign in first', { status: 401 });", ''), /signed-in/],
  'stores what it was asked': [RIGHT.replace("if (!res.ok)", "await supabase.from('searches').insert({ text }); if (!res.ok)"), /writes something/],
  'stores the answer in a cache': [RIGHT.replace("if (!res.ok)", "await (await caches.open('p')).put(text, res.clone()); if (!res.ok)"), /writes something/],
  'sends Google the member’s sign-in through an address held in a variable': [
    RIGHT.replace("const res = placeId", "const target = 'https://places.googleapis.com/v1/places:autocomplete'; await fetch(target, { headers: { 'X-Goog-Api-Key': key, Authorization: req.headers.get('Authorization') ?? '' } });\n  const res = placeId"),
    /header it should not|something about the member/,
  ],
  'does not insist on POST': [RIGHT.replace("if (req.method !== 'POST') return new Response('POST only', { status: 405 });", ''), /insist on POST/],
};

describe('the street-address search keeps what Privacy says it keeps (a74)', () => {
  it('finds nothing wrong with a function built the way Piper described', () => {
    expect(problemsIn(RIGHT)).toEqual([]);
  });

  for (const [what, [source, expected]] of Object.entries(WRONG)) {
    it(`is red for a function that ${what}`, () => {
      const problems = problemsIn(source);
      expect(problems.length, `the checks did not notice a function that ${what}`).toBeGreaterThan(0);
      expect(problems.join('\n')).toMatch(expected);
    });
  }

  describe.skipIf(!existsSync(FUNCTION))('the real function (supabase/functions/places-search)', () => {
    it('is held to the same four promises', () => {
      expect(problemsIn(`${readFileSync(FUNCTION, 'utf8')}\n${existsSync(HANDLER) ? readFileSync(HANDLER, 'utf8') : ''}`)).toEqual([]);
    });
  });
});

/**
 * “Pam does not keep what you type or what Google answers” (option A, Mira 13 October; D-552): a place picked from Google's suggestions
 * is for that one search. The function writes nothing (above); the phone must write nothing either. `saveOrigin` is the only thing that
 * keeps a picked area (`pam.origin`, on the phone), and it skips an id that starts with GOOGLE_PICK, like the phone's own position;
 * `loadOrigin` throws away one an earlier build might have kept. Behaviour is tested in `areaOrigin.test.ts` (web); this holds the source
 * so Privacy's sentence cannot become untrue by another route: no storage API in the street-search code, and nobody else writes `pam.origin`.
 */
const WEB = fileURLToPath(new URL('../../../apps/web/src', import.meta.url));
const AREA = join(WEB, 'lib/useAreaSearch.ts');
const STREET_FILES = [join(WEB, 'lib/streetSearch.ts'), join(WEB, 'lib/useStreetSearch.ts')];

describe.skipIf(!existsSync(AREA) || !/GOOGLE_PICK/.test(existsSync(AREA) ? readFileSync(AREA, 'utf8') : ''))('a picked street address is kept nowhere on the phone (option A, D-552)', () => {
  const area = readFileSync(AREA, 'utf8');
  const save = area.slice(area.indexOf('export function saveOrigin'));

  it('has saveOrigin skip a Google pick before it writes anything', () => {
    const skip = save.search(/origin\.id\.startsWith\(GOOGLE_PICK\)/);
    const write = save.search(/setItem\(/);
    expect(skip, 'saveOrigin must return early for a Google pick').toBeGreaterThan(-1);
    expect(write).toBeGreaterThan(skip);
  });

  it('has loadOrigin throw away a Google pick an earlier build kept', () => {
    const load = area.slice(area.indexOf('export function loadOrigin'), area.indexOf('export function saveOrigin'));
    expect(load).toMatch(/startsWith\(GOOGLE_PICK\)[\s\S]*removeItem\(/);
  });

  it('uses no storage, cookie or beacon in the street-search code', () => {
    for (const file of STREET_FILES.filter(existsSync)) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|caches\./);
    }
  });

  it('keeps the main search\'s typed-address point in React state and nowhere else (D-573)', () => {
    const file = join(WEB, 'lib/useAddressOrigin.ts');
    if (!existsSync(file)) return;
    // Its own comments say what it never does, so read the code without them.
    const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(code, file).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|caches\./);
    expect(code, file).not.toMatch(/saveOrigin|loadOrigin|pam\.origin/);
    // The only thing it takes from the saved-area module is a type, which is gone when the code runs.
    for (const line of code.split('\n').filter((l) => /from '\.\/useAreaSearch'/.test(l))) expect(line).toMatch(/^import type /);
  });

  it('has nothing but useAreaSearch.ts write the saved area', () => {
    const others: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) {
          if (name !== 'stories' && name !== 'node_modules') walk(path);
        } else if (/\.tsx?$/.test(name) && !/\.test\./.test(name) && path !== AREA && /pam\.origin/.test(readFileSync(path, 'utf8'))) others.push(path);
      }
    };
    walk(WEB);
    expect(others, 'Only useAreaSearch.ts may read or write pam.origin').toEqual([]);
  });
});

describe.skipIf(EN['privacy.s.sharing.p7'] === undefined)('the Privacy line about the street-address search (a74)', () => {
  // The signed English uses straight apostrophes and the rest of the page curly ones: one word to this test.
  const p7 = (EN['privacy.s.sharing.p7'] ?? '').replace(/’/g, "'");
  const sharing = PRIVACY.sections.find((s) => s.id === 'sharing');

  it('is in “Who else gets your information”', () => {
    expect(sharing?.bodyKeys).toContain('privacy.s.sharing.p7');
  });

  it('names Google, says Pam’s server asks and says what Google gets and does not get', () => {
    expect(p7).toMatch(/Google/);
    expect(p7).toMatch(/Pam's server/);
    expect(p7).toMatch(/your name, your phone number or your phone's IP address/);
  });

  it('leaves the map line true: the phone talks only to Pam for this', () => {
    expect(EN['privacy.s.sharing.p5']).toMatch(/The map is the only part of Pam that your phone loads from Google\.$/);
    expect(p7).toMatch(/your phone does not talk to Google/);
  });

  it('does not promise what Google does with the words, and says it is up to Google', () => {
    expect(p7).not.toMatch(/Google (deletes|will not|may not|does not keep)/i);
    expect(p7).toMatch(/What Google keeps is up to Google\.$/);
  });

  it('says Pam keeps neither what was typed nor what Google answers (option A, Mira 13 October: a Google pick is for that search only, like “use my current location”, D-536)', () => {
    // True only while a picked address is never saved on the phone either (`saveOrigin`) and the function writes nothing:
    // the second half is `problemsIn` above, on the real function; the first is pinned beside it once Piper's change is on the branch.
    expect(p7).toMatch(/Pam does not keep what you type or what Google answers\./);
    expect(p7).not.toMatch(/Pam's servers do not keep|remembers the place you picked/);
  });
});
