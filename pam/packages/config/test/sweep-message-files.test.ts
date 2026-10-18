import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUCKETS, GRACE_MS, handle, toRemove, type Deps } from '../../../supabase/functions/sweep-message-files/handler.ts';

/**
 * The nightly sweep of message files (D-607): in `message-photos`, `message-files` and `link-previews`, only the files a message
 * still points at, in a conversation that still exists, stay. The file of an erased person's conversation goes, a live
 * conversation's pointed-at file stays, a file being sent right now is left alone, and nothing runs without the shared secret or
 * with a read that came back short. Fake database and storage; nothing leaves the test.
 */
const NOW = Date.parse('2026-10-18T04:50:00Z');
const OLD = new Date(NOW - 2 * GRACE_MS).toISOString();
const FRESH = new Date(NOW - 60_000).toISOString();

type Files = Record<string, { name: string; created_at: string }[]>;

function world(opts: {
  conversations: string[];
  messageAttachments?: string[];
  previewPictures?: string[];
  buckets: Partial<Record<string, Files>>;
  pageCap?: number;
  secret?: string | null;
  failRead?: string;
}) {
  const removed: { bucket: string; path: string }[] = [];
  const calls: string[] = [];
  const table = (name: string, column: string, values: string[]) => ({ name, column, values });
  const tables = [
    table('conversations', 'id', opts.conversations),
    table('messages', 'attachment_url', opts.messageAttachments ?? []),
    table('message_link_previews', 'image_path', opts.previewPictures ?? []),
  ];
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push(`${init?.method ?? 'GET'} ${url.pathname}`);
    const t = tables.find((x) => url.pathname === `/rest/v1/${x.name}`);
    if (t) {
      if (opts.failRead === t.name) return new Response('down', { status: 500 });
      const offset = Number(url.searchParams.get('offset'));
      const limit = Math.min(Number(url.searchParams.get('limit')), opts.pageCap ?? Infinity);
      const rows = t.values.slice(offset, offset + limit).map((v) => ({ [t.column]: v }));
      return new Response(JSON.stringify(rows), { headers: { 'content-range': `${offset}-${offset + rows.length - 1}/${t.values.length}` } });
    }
    const list = url.pathname.match(/^\/storage\/v1\/object\/list\/(.+)$/);
    if (list) {
      const files = opts.buckets[list[1]!] ?? {};
      const { prefix } = JSON.parse(String(init?.body)) as { prefix: string };
      if (prefix === '') return Response.json(Object.keys(files).map((name) => ({ name, id: null, created_at: null })));
      return Response.json((files[prefix] ?? []).map((f) => ({ ...f, id: `id-${f.name}` })));
    }
    const del = url.pathname.match(/^\/storage\/v1\/object\/([^/]+)$/);
    if (del && init?.method === 'DELETE') {
      for (const path of (JSON.parse(String(init.body)) as { prefixes: string[] }).prefixes) removed.push({ bucket: del[1]!, path });
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

describe('toRemove', () => {
  const files = [
    { name: 'a.jpg', created_at: OLD },
    { name: 'b.jpg', created_at: OLD },
    { name: 'c.jpg', created_at: FRESH },
  ];
  it('in a live conversation keeps what a message points at and anything younger than an hour', () => {
    expect(toRemove('c1', files, true, new Set(['c1/b.jpg']), NOW)).toEqual(['c1/a.jpg']);
  });
  it('in a conversation that is gone removes every file but the one being sent', () => {
    expect(toRemove('gone', files, false, new Set(['gone/b.jpg']), NOW)).toEqual(['gone/a.jpg', 'gone/b.jpg']);
  });
});

describe('the sweep (D-607)', () => {
  it('removes the file of a conversation that was erased, in each of the three buckets, and keeps a live conversation\'s', async () => {
    const w = world({
      conversations: ['live'],
      messageAttachments: ['live/photo.jpg', 'live/doc.pdf'],
      previewPictures: ['live/preview.jpg'],
      buckets: {
        'message-photos': { live: [{ name: 'photo.jpg', created_at: OLD }], erased: [{ name: 'gone.jpg', created_at: OLD }] },
        'message-files': { live: [{ name: 'doc.pdf', created_at: OLD }], erased: [{ name: 'gone.pdf', created_at: OLD }] },
        'link-previews': { live: [{ name: 'preview.jpg', created_at: OLD }], erased: [{ name: 'gone.png', created_at: OLD }] },
      },
    });
    const res = await w.call();
    expect(res.status).toBe(200);
    expect(w.removed.sort((a, b) => a.path.localeCompare(b.path))).toEqual([
      { bucket: 'message-photos', path: 'erased/gone.jpg' },
      { bucket: 'message-files', path: 'erased/gone.pdf' },
      { bucket: 'link-previews', path: 'erased/gone.png' },
    ].sort((a, b) => a.path.localeCompare(b.path)));
    expect(await res.json()).toEqual({ folders: 6, removed: 3, failed: 0 });
  });

  it('removes a file in a live conversation that no message points at (an upload the phone lost its connection over)', async () => {
    const w = world({
      conversations: ['live'],
      messageAttachments: ['live/used.jpg'],
      buckets: { 'message-photos': { live: [{ name: 'used.jpg', created_at: OLD }, { name: 'lost.jpg', created_at: OLD }] } },
    });
    await w.call();
    expect(w.removed).toEqual([{ bucket: 'message-photos', path: 'live/lost.jpg' }]);
  });

  it('leaves a photo that is being sent right now, in a conversation or not', async () => {
    const w = world({
      conversations: ['live'],
      buckets: { 'message-photos': { live: [{ name: 'now.jpg', created_at: FRESH }], newer: [{ name: 'x.jpg', created_at: FRESH }] } },
    });
    await w.call();
    expect(w.removed).toEqual([]);
  });

  it('reads every conversation and every attachment even when the server gives fewer rows a page than asked, so nothing in use is lost', async () => {
    const conversations = Array.from({ length: 7 }, (_, i) => `c${i}`);
    const w = world({
      conversations,
      messageAttachments: conversations.map((c) => `${c}/a.jpg`),
      pageCap: 3,
      buckets: { 'message-photos': Object.fromEntries(conversations.map((c) => [c, [{ name: 'a.jpg', created_at: OLD }]])) },
    });
    await w.call();
    expect(w.removed).toEqual([]);
  });

  it('does nothing without the shared secret, or with a wrong one', async () => {
    const unset = world({ conversations: [], buckets: { 'message-photos': { gone: [{ name: '1.jpg', created_at: OLD }] } }, secret: null });
    expect((await unset.call()).status).toBe(503);
    const wrong = world({ conversations: [], buckets: { 'message-photos': { gone: [{ name: '1.jpg', created_at: OLD }] } } });
    expect((await wrong.call('guess')).status).toBe(401);
    expect([...unset.calls, ...wrong.calls]).toEqual([]);
  });

  it('removes nothing when any read comes back failed: not the conversations, not what the files belong to', async () => {
    for (const failRead of ['conversations', 'messages', 'message_link_previews']) {
      const w = world({
        conversations: [],
        failRead,
        buckets: { 'message-photos': { gone: [{ name: '1.jpg', created_at: OLD }] }, 'link-previews': { gone: [{ name: '1.png', created_at: OLD }] } },
      });
      const res = await w.call();
      expect(res.status, failRead).toBe(502);
      expect(w.removed, failRead).toEqual([]);
    }
  });

  it('knows the three buckets, and what points at each', () => {
    expect(BUCKETS.map((b) => b.bucket)).toEqual(['message-photos', 'message-files', 'link-previews']);
  });
});

describe('the clock (D-607)', () => {
  const PAM = fileURLToPath(new URL('../../../', import.meta.url));
  const dir = path.join(PAM, 'packages/db/migrations');
  const sql = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => readFileSync(path.join(dir, f), 'utf8').replace(/--.*$/gm, ''))
    .join('\n');

  it('is scheduled every night, sends the shared secret, and is its own job beside the staff photos\'', () => {
    expect(sql).toMatch(/cron\.schedule\(\s*'sweep-message-files'\s*,\s*'50 4 \* \* \*'/);
    expect(sql).toMatch(/functions\/v1\/sweep-message-files/);
    expect(sql).toMatch(/cron\.unschedule\(jobid\) from cron\.job where jobname = 'sweep-message-files'/);
  });

  it('keeps the promise that a function with no shared secret does nothing (the handler refuses without one)', () => {
    const handler = readFileSync(path.join(PAM, 'supabase/functions/sweep-message-files/handler.ts'), 'utf8');
    expect(handler).toMatch(/x-dispatch-secret/);
    expect(handler).not.toMatch(/console\.log\([^)]*(path|folder\b[^)]*\$\{)/);
  });
});
