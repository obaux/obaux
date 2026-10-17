import { describe, expect, it } from 'vitest';
import { GRACE_MS, handle, pathOf, toRemove, type Deps } from '../../../supabase/functions/sweep-staff-photos/handler.ts';

/**
 * The nightly sweep of staff photos (Lena's privacy guard, D-587; D-345): in each person's folder only the file
 * their profile points at stays. A deleted account's folder is emptied, a replaced photo goes, a photo being saved
 * right now is left alone, and nothing runs without the shared secret. Fake database and storage; nothing leaves the
 * test.
 */
const NOW = Date.parse('2026-10-16T04:35:00Z');
const OLD = new Date(NOW - 2 * GRACE_MS).toISOString();
const FRESH = new Date(NOW - 60_000).toISOString();
const URL_OF = (path: string) => `https://stub.supabase.co/storage/v1/object/public/staff-photos/${path}`;

type Profile = { id: string; photo_url: string | null };

function world(opts: { profiles: Profile[]; folders: Record<string, { name: string; created_at: string }[]>; pageCap?: number; secret?: string | null }) {
  const removed: string[] = [];
  const calls: string[] = [];
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push(`${init?.method ?? 'GET'} ${url.pathname}`);
    if (url.pathname === '/rest/v1/profiles') {
      const offset = Number(url.searchParams.get('offset'));
      const limit = Math.min(Number(url.searchParams.get('limit')), opts.pageCap ?? Infinity);
      const withPhoto = opts.profiles.filter((p) => p.photo_url !== null);
      const rows = withPhoto.slice(offset, offset + limit);
      return new Response(JSON.stringify(rows), {
        headers: { 'content-range': `${offset}-${offset + rows.length - 1}/${withPhoto.length}` },
      });
    }
    if (url.pathname === '/storage/v1/object/list/staff-photos') {
      const { prefix } = JSON.parse(String(init?.body)) as { prefix: string };
      if (prefix === '') return Response.json(Object.keys(opts.folders).map((name) => ({ name, id: null, created_at: null })));
      return Response.json((opts.folders[prefix] ?? []).map((f) => ({ ...f, id: `id-${f.name}` })));
    }
    if (url.pathname === '/storage/v1/object/staff-photos' && init?.method === 'DELETE') {
      removed.push(...(JSON.parse(String(init.body)) as { prefixes: string[] }).prefixes);
      return Response.json([]);
    }
    return new Response('not found', { status: 404 });
  }) as typeof globalThis.fetch;
  const env: Record<string, string | undefined> = {
    DISPATCH_SECRET: opts.secret === null ? undefined : 's3cret',
    SUPABASE_URL: 'https://stub.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
  };
  const deps: Deps = { get: (n) => env[n], fetch, now: () => NOW };
  const call = (secret = 's3cret') => handle(new Request('https://x/sweep', { method: 'POST', headers: { 'x-dispatch-secret': secret } }), deps);
  return { removed, calls, call };
}

describe('pathOf', () => {
  it('reads the path in the bucket out of a public photo URL', () => {
    expect(pathOf(URL_OF('u1/1.webp'))).toBe('u1/1.webp');
    expect(pathOf(null)).toBeNull();
    expect(pathOf('https://elsewhere.example/u1/1.webp')).toBeNull();
  });
});

describe('toRemove', () => {
  it('keeps the photo the profile points at, and anything younger than an hour', () => {
    const files = [
      { name: '1.webp', created_at: OLD },
      { name: '2.webp', created_at: OLD },
      { name: '3.webp', created_at: FRESH },
    ];
    expect(toRemove('u1', files, 'u1/2.webp', NOW)).toEqual(['u1/1.webp']);
    expect(toRemove('u1', files, null, NOW)).toEqual(['u1/1.webp', 'u1/2.webp']);
  });
});

describe('the sweep', () => {
  it('empties the folder of a deleted account, and keeps only the current photo of a live one (D-587)', async () => {
    const w = world({
      profiles: [{ id: 'dana', photo_url: URL_OF('dana/2.webp') }],
      folders: {
        dana: [
          { name: '1.webp', created_at: OLD },
          { name: '2.webp', created_at: OLD },
        ],
        // An account that was deleted: no profile any more.
        gone: [{ name: '9.webp', created_at: OLD }],
      },
    });
    const res = await w.call();
    expect(res.status).toBe(200);
    expect(w.removed.sort()).toEqual(['dana/1.webp', 'gone/9.webp']);
    expect(await res.json()).toEqual({ folders: 2, removed: 2, failed: 0 });
  });

  it('empties the folder of someone who took their photo down', async () => {
    const w = world({ profiles: [{ id: 'ray', photo_url: null }], folders: { ray: [{ name: '1.webp', created_at: OLD }] } });
    await w.call();
    expect(w.removed).toEqual(['ray/1.webp']);
  });

  it('leaves a photo that is being saved right now', async () => {
    const w = world({ profiles: [], folders: { new: [{ name: '1.webp', created_at: FRESH }] } });
    await w.call();
    expect(w.removed).toEqual([]);
  });

  it('reads every profile even when the server gives fewer rows a page than asked, so no photo in use is lost', async () => {
    const profiles = Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, photo_url: URL_OF(`p${i}/a.webp`) }));
    const folders = Object.fromEntries(profiles.map((p) => [p.id, [{ name: 'a.webp', created_at: OLD }]]));
    const w = world({ profiles, folders, pageCap: 3 });
    await w.call();
    expect(w.removed).toEqual([]);
  });

  it('does nothing without the shared secret, or with a wrong one', async () => {
    const unset = world({ profiles: [], folders: { gone: [{ name: '1.webp', created_at: OLD }] }, secret: null });
    expect((await unset.call()).status).toBe(503);
    const wrong = world({ profiles: [], folders: { gone: [{ name: '1.webp', created_at: OLD }] } });
    expect((await wrong.call('guess')).status).toBe(401);
    expect([...unset.calls, ...wrong.calls]).toEqual([]);
  });

  it('stops before touching storage when the profiles cannot be read', async () => {
    const calls: string[] = [];
    const res = await handle(new Request('https://x', { method: 'POST', headers: { 'x-dispatch-secret': 's3cret' } }), {
      get: (n) => ({ DISPATCH_SECRET: 's3cret', SUPABASE_URL: 'https://stub.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k' })[n],
      fetch: (async (input: RequestInfo | URL) => {
        calls.push(new URL(String(input)).pathname);
        return new Response('down', { status: 500 });
      }) as typeof fetch,
      now: () => NOW,
    });
    expect(res.status).toBe(502);
    expect(calls).toEqual(['/rest/v1/profiles']);
  });
});
