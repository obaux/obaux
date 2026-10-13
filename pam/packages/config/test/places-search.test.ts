import { describe, expect, it } from 'vitest';
import { BOX, LIMITS, handle, parseRequest, shorten, type Deps } from '../../../supabase/functions/places-search/handler.ts';

/**
 * The street search through Google (D-552): off until a key exists, Google hears only the typed words from Pam's server, nothing
 * is kept or logged, and every answer stays inside Philadelphia. Fake Google, fake database; nothing leaves the test.
 */
const TOKEN = 'abcdefghijklmnop1234';
const PLACE = 'ChIJabcdefghijk123';

function world(opts: { env?: Record<string, string | undefined>; signedIn?: boolean; google?: (url: string, init?: RequestInit) => Response } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const env: Record<string, string | undefined> = {
    GOOGLE_MAPS_SERVER_KEY: 'the-key',
    SUPABASE_URL: 'https://stub.supabase.co',
    SUPABASE_ANON_KEY: 'anon',
    ...opts.env,
  };
  let clock = 1_000_000;
  const deps: Deps = {
    get: (name) => env[name],
    now: () => (clock += 10),
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(url.startsWith('https://places.googleapis.com') ? { url, init } : { url });
      if (url.includes('/auth/v1/user')) {
        return opts.signedIn === false
          ? new Response('{}', { status: 401 })
          : new Response(JSON.stringify({ id: `member-${Math.random()}` }), { status: 200 });
      }
      return (opts.google ?? (() => new Response('{}', { status: 200 })))(url, init);
    }) as typeof fetch,
  };
  const ask = (body: unknown, headers: Record<string, string> = { Authorization: 'Bearer jwt' }) =>
    handle(new Request('https://x.test/places-search', { method: 'POST', headers, body: JSON.stringify(body) }), deps);
  return { ask, calls, deps };
}

const googleCalls = (calls: { url: string }[]) => calls.filter((c) => c.url.startsWith('https://places.googleapis.com'));

describe('places-search', () => {
  it('is off without the key: { enabled: false }, and it touches nothing', async () => {
    const w = world({ env: { GOOGLE_MAPS_SERVER_KEY: undefined } });
    const res = await w.ask({ action: 'suggest', q: '1500 Market', token: TOKEN });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ enabled: false });
    expect(w.calls).toEqual([]);
  });

  it('wants a signed-in member', async () => {
    expect((await world().ask({ action: 'suggest', q: '1500 Market', token: TOKEN }, {})).status).toBe(401);
    const w = world({ signedIn: false });
    expect((await w.ask({ action: 'suggest', q: '1500 Market', token: TOKEN })).status).toBe(401);
    expect(googleCalls(w.calls)).toEqual([]);
  });

  it('asks Google for suggestions inside the Philadelphia box, with only the words, the token and the key', async () => {
    const w = world({
      google: () =>
        new Response(
          JSON.stringify({
            suggestions: [
              { placePrediction: { placeId: PLACE, text: { text: '1500 Market St, Philadelphia, PA, USA' } } },
              { queryPrediction: { text: { text: 'ignored' } } },
            ],
          }),
          { status: 200 },
        ),
    });
    const res = await w.ask({ action: 'suggest', q: '1500  Market', token: TOKEN });
    expect(await res.json()).toEqual({ enabled: true, suggestions: [{ placeId: PLACE, label: '1500 Market St, Philadelphia, PA' }] });
    const [call] = googleCalls(w.calls);
    expect(call!.url).toBe('https://places.googleapis.com/v1/places:autocomplete');
    const sent = JSON.parse(String(call!.init?.body));
    expect(sent).toEqual({ input: '1500 Market', sessionToken: TOKEN, locationRestriction: { rectangle: BOX }, includedRegionCodes: ['us'] });
    // Nothing about the member goes with it: only the key header and the content type.
    expect(Object.keys(call!.init?.headers as Record<string, string>).sort()).toEqual(['Content-Type', 'X-Goog-Api-Key']);
    expect(JSON.stringify(call!.init)).not.toMatch(/member-|Bearer jwt|supabase/);
  });

  it('asks for the location and address alone when a place is chosen, and answers a label and a point', async () => {
    const w = world({
      google: () => new Response(JSON.stringify({ formattedAddress: '1500 Market St, Philadelphia, PA 19102, USA', location: { latitude: 39.9526, longitude: -75.1664 } }), { status: 200 }),
    });
    const res = await w.ask({ action: 'choose', placeId: PLACE, token: TOKEN });
    expect(await res.json()).toEqual({ enabled: true, place: { label: '1500 Market St, Philadelphia, PA 19102', lat: 39.9526, lon: -75.1664 } });
    const [call] = googleCalls(w.calls);
    expect(call!.url).toBe(`https://places.googleapis.com/v1/places/${PLACE}?sessionToken=${TOKEN}`);
    expect((call!.init?.headers as Record<string, string>)['X-Goog-FieldMask']).toBe('location,formattedAddress');
  });

  it('drops a place Google puts outside Philadelphia', async () => {
    const w = world({ google: () => new Response(JSON.stringify({ formattedAddress: 'Somewhere', location: { latitude: 40.7128, longitude: -74.006 } }), { status: 200 }) });
    expect(await (await w.ask({ action: 'choose', placeId: PLACE, token: TOKEN })).json()).toEqual({ enabled: true, place: null });
  });

  it('refuses a bad request before it asks anybody anything', async () => {
    const w = world();
    for (const body of [
      { action: 'suggest', q: 'ab', token: TOKEN },
      { action: 'suggest', q: 'x'.repeat(LIMITS.query + 1), token: TOKEN },
      { action: 'suggest', q: '1500 Market', token: 'short' },
      { action: 'choose', placeId: '../../etc', token: TOKEN },
      { action: 'delete', token: TOKEN },
      'not an object',
    ]) {
      expect((await w.ask(body)).status, JSON.stringify(body)).toBe(400);
    }
    expect(googleCalls(w.calls)).toEqual([]);
  });

  it('says nothing useful, and no error, when Google is down', async () => {
    const w = world({ google: () => new Response('no', { status: 503 }) });
    expect(await (await w.ask({ action: 'suggest', q: '1500 Market', token: TOKEN })).json()).toEqual({ enabled: true, suggestions: [], unavailable: true });
  });

  it('never logs what was typed', async () => {
    const logged: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => logged.push(args.join(' '));
    try {
      const w = world({ google: () => new Response('no', { status: 503 }) });
      await w.ask({ action: 'suggest', q: '1500 Market secret words', token: TOKEN });
    } finally {
      console.error = original;
    }
    expect(logged.join(' ')).not.toMatch(/Market|secret|words/);
  });

  it('slows a member who asks too often', async () => {
    const env = { GOOGLE_MAPS_SERVER_KEY: 'the-key', SUPABASE_URL: 'https://stub.supabase.co', SUPABASE_ANON_KEY: 'anon' };
    let clock = 5_000_000;
    const deps: Deps = {
      get: (n) => (env as Record<string, string>)[n],
      now: () => (clock += 10),
      fetch: (async (input: RequestInfo | URL) =>
        String(input).includes('/auth/v1/user') ? new Response(JSON.stringify({ id: 'the-same-member' })) : new Response('{"suggestions":[]}')) as typeof fetch,
    };
    const ask = () =>
      handle(new Request('https://x.test', { method: 'POST', headers: { Authorization: 'Bearer j' }, body: JSON.stringify({ action: 'suggest', q: '1500 Market', token: TOKEN }) }), deps);
    let last = 200;
    for (let i = 0; i <= LIMITS.perMinute; i += 1) last = (await ask()).status;
    expect(last).toBe(429);
  });

  it('parses and shortens', () => {
    expect(parseRequest({ action: 'suggest', q: ' Broad & Erie ', token: TOKEN })).toEqual({ action: 'suggest', q: 'Broad & Erie', token: TOKEN });
    expect(shorten('Temple University Hospital, Philadelphia, PA, USA')).toBe('Temple University Hospital, Philadelphia, PA');
  });
});
