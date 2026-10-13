// places-search: the area search's street addresses and corners, from Google, asked by Pam's server (D-552).
// (The handler, with everything it touches passed in so it can be tested; index.ts wires it to Deno.)
//
// Called by the app, as the signed-in member, while they type in "Near …" on the places screen. Two questions:
//
//   { action: 'suggest', q, token }     what could they mean?  -> [{ placeId, label }]
//   { action: 'choose', placeId, token } where is that?        -> { label, lat, lon }
//
// The rules that matter:
//
//   1. It is off until the key exists. Without GOOGLE_MAPS_SERVER_KEY it answers { enabled: false } and touches nothing: not Google,
//      not the database. The app reads that and keeps its own ZIP and neighborhood search, with no error.
//   2. Google hears from Pam's server and from nobody else. It is told the typed words (or the chosen place's id), a random
//      per-search session token the phone made up, and a box around Philadelphia. It is never told who is asking: no member id, name,
//      phone number, or the phone's IP address (the request comes from this server). The phone never calls Google for this.
//   3. It keeps nothing and says nothing: it never logs what was typed or what came back, and writes no table. Counts and
//      statuses at most.
//   4. It asks only for what it needs: Autocomplete, then Place Details for the location and address alone (the cheapest tier,
//      and a session that ends there is billed as one).
//   5. Whoever calls it is signed in (their own sign-in is checked with Pam's database), and a person who asks too often is told to
//      wait: the daily quota on the key in Google Cloud is the real ceiling.
//   6. Answers are kept to Philadelphia: a place that Google puts outside the box is dropped.

// The app calls this from its own origin with a bearer token (no cookies), so any origin may read the answer.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const JSON_HEADERS = { 'Content-Type': 'application/json', ...CORS };

export function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** A box around Philadelphia (a little wider than the city's edge). */
export const BOX = { low: { latitude: 39.85, longitude: -75.3 }, high: { latitude: 40.15, longitude: -74.93 } } as const;

export const LIMITS = { query: 120, minQuery: 3, suggestions: 5, perMinute: 40, body: 2000 } as const;

export interface Deps {
  readonly get: (name: string) => string | undefined;
  readonly fetch: typeof fetch;
  readonly now?: () => number;
}

export type Wanted =
  | { readonly action: 'suggest'; readonly q: string; readonly token: string }
  | { readonly action: 'choose'; readonly placeId: string; readonly token: string };

export class BadRequest extends Error {}

const TOKEN = /^[A-Za-z0-9_-]{16,64}$/;
const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;
// Control characters, built from character codes (see help-request/handler.ts for why).
const CONTROL = new RegExp(`[${Array.from({ length: 32 }, (_, code) => String.fromCharCode(code)).join('')}${String.fromCharCode(127)}]`, 'g');

export function parseRequest(raw: unknown): Wanted {
  if (!raw || typeof raw !== 'object') throw new BadRequest('a JSON object is expected');
  const body = raw as Record<string, unknown>;
  const token = body['token'];
  if (typeof token !== 'string' || !TOKEN.test(token)) throw new BadRequest('a session token is needed');
  if (body['action'] === 'suggest') {
    const q = typeof body['q'] === 'string' ? body['q'].replace(CONTROL, ' ').replace(/\s+/g, ' ').trim() : '';
    if (q.length < LIMITS.minQuery) throw new BadRequest('type a little more');
    if (q.length > LIMITS.query) throw new BadRequest('that is too long');
    return { action: 'suggest', q, token };
  }
  if (body['action'] === 'choose') {
    const placeId = body['placeId'];
    if (typeof placeId !== 'string' || !PLACE_ID.test(placeId)) throw new BadRequest('a place is needed');
    return { action: 'choose', placeId, token };
  }
  throw new BadRequest('unknown action');
}

const inBox = (lat: number, lon: number) =>
  lat >= BOX.low.latitude && lat <= BOX.high.latitude && lon >= BOX.low.longitude && lon <= BOX.high.longitude;

/** "1500 Market St, Philadelphia, PA 19102, USA" -> without the country: the member knows which country. */
export const shorten = (label: string) => label.replace(/,\s*(USA|United States)$/i, '').trim();

// One isolate's memory of who asked how often in the last minute. A new isolate forgets; the key's own quota is the ceiling.
const recent = new Map<string, number[]>();
function tooOften(user: string, now: number): boolean {
  const since = now - 60_000;
  const times = (recent.get(user) ?? []).filter((t) => t > since);
  times.push(now);
  recent.set(user, times);
  // A busy isolate forgets everybody at once rather than grow without end.
  if (recent.size > 5000) recent.clear();
  return times.length > LIMITS.perMinute;
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const key = deps.get('GOOGLE_MAPS_SERVER_KEY');
  if (!key) return reply(200, { enabled: false });
  if (request.method !== 'POST') return reply(405, { error: 'POST only' });

  const jwt = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!jwt) return reply(401, { error: 'sign in first' });

  const text = await request.text();
  if (text.length > LIMITS.body) return reply(413, { error: 'too large' });
  let wanted: Wanted;
  try {
    wanted = parseRequest(JSON.parse(text));
  } catch (error) {
    return reply(400, { error: error instanceof BadRequest ? error.message : 'a JSON object is expected' });
  }

  // Who is asking: only to know they are signed in and to count them; the answer never leaves this function.
  const url = deps.get('SUPABASE_URL');
  const anon = deps.get('SUPABASE_ANON_KEY');
  if (!url || !anon) throw new Error('the function has no database credentials');
  const who = await deps.fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${jwt}` } });
  if (!who.ok) return reply(401, { error: 'sign in first' });
  const user = ((await who.json()) as { id?: string }).id;
  if (!user) return reply(401, { error: 'sign in first' });
  if (tooOften(user, (deps.now ?? Date.now)())) return reply(429, { error: 'slow down' });

  try {
    if (wanted.action === 'suggest') {
      const response = await deps.fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
        body: JSON.stringify({
          input: wanted.q,
          sessionToken: wanted.token,
          locationRestriction: { rectangle: BOX },
          includedRegionCodes: ['us'],
        }),
      });
      if (!response.ok) {
        console.error('places autocomplete did not answer ok');
        return reply(200, { enabled: true, suggestions: [], unavailable: true });
      }
      const data = (await response.json()) as { suggestions?: { placePrediction?: { placeId?: string; text?: { text?: string } } }[] };
      const suggestions = (data.suggestions ?? [])
        .map((s) => s.placePrediction)
        .filter((p): p is { placeId: string; text: { text: string } } => Boolean(p?.placeId && p.text?.text))
        .slice(0, LIMITS.suggestions)
        .map((p) => ({ placeId: p.placeId, label: shorten(p.text.text) }));
      return reply(200, { enabled: true, suggestions });
    }

    const response = await deps.fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(wanted.placeId)}?sessionToken=${encodeURIComponent(wanted.token)}`,
      { headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'location,formattedAddress' } },
    );
    if (!response.ok) {
      console.error('places details did not answer ok');
      return reply(200, { enabled: true, place: null, unavailable: true });
    }
    const data = (await response.json()) as { formattedAddress?: string; location?: { latitude?: number; longitude?: number } };
    const lat = data.location?.latitude;
    const lon = data.location?.longitude;
    if (typeof lat !== 'number' || typeof lon !== 'number' || !inBox(lat, lon)) return reply(200, { enabled: true, place: null });
    return reply(200, { enabled: true, place: { label: shorten(data.formattedAddress ?? ''), lat, lon } });
  } catch {
    console.error('places-search failed');
    return reply(200, { enabled: true, ...(wanted.action === 'suggest' ? { suggestions: [] } : { place: null }), unavailable: true });
  }
}
