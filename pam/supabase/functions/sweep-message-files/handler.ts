// sweep-message-files: removes every photo, document and link picture that no conversation or message uses any more (D-607; the
// merge desk, 18 October 2026, after the privacy guard's first run, D-587). The handler, with everything it touches passed in so it
// can be tested; index.ts wires it to Deno.
//
// Why a sweep. `privacy.s.how-long.p1` says "We keep your account, and your messages, photos and documents, while you use Pam. Ask us
// to delete it and we will." The database deletes a conversation's messages when the person is erased (they cascade), and nothing in
// the database can remove a FILE from Storage: removing the row from `storage.objects` would leave the file itself. So once a night
// this keeps, in each of the three message buckets, only the files a message still points at:
//
//   * `message-photos` and `message-files` (0079, 0080): `<conversation id>/<random>`, pointed at by `messages.attachment_url`.
//   * `link-previews` (0081): `<conversation id>/<random>`, pointed at by `message_link_previews.image_path`.
//
//   1. A folder whose conversation is gone is emptied.
//   2. In a folder whose conversation exists, a file no message points at goes (an upload the phone lost its connection over).
//   3. A file younger than an hour is left alone: the app uploads first and inserts the message second, so a file seen between the
//      two is a photo being sent, not a leftover.
//
// The rules that matter:
//   * It is not a delete button: a call needs the shared secret (DISPATCH_SECRET, x-dispatch-secret), as the other clocks do.
//   * It reads everything it needs, all the way through, BEFORE it removes anything. A page missed would read as "nothing points
//     here" and empty a folder that is in use, so any failed or short read stops the sweep with nothing removed.
//   * It never logs a name, a path or a person's id: counts only.

const JSON_HEADERS = { 'Content-Type': 'application/json' };
/** A file this young may be one being sent (uploaded, message not yet written). */
export const GRACE_MS = 60 * 60 * 1000;
const PAGE = 1000;

/** The three buckets, and what points at their files. */
export const BUCKETS = [
  { bucket: 'message-photos', table: 'messages', column: 'attachment_url', filter: 'attachment_url=not.is.null' },
  { bucket: 'message-files', table: 'messages', column: 'attachment_url', filter: 'attachment_url=not.is.null' },
  { bucket: 'link-previews', table: 'message_link_previews', column: 'image_path', filter: 'image_path=not.is.null' },
] as const;

export function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** Everything the handler touches outside itself, so a test can hand it fakes. */
export interface Deps {
  readonly get: (name: string) => string | undefined;
  readonly fetch: typeof fetch;
  readonly now: () => number;
}

export interface StoredFile {
  readonly name: string;
  readonly created_at: string | null;
}

/**
 * The files to remove from one folder: none if the folder's conversation exists and the file is pointed at; every file otherwise;
 * and never a file younger than the grace period.
 */
export function toRemove(
  folder: string,
  files: readonly StoredFile[],
  conversationExists: boolean,
  pointedAt: ReadonlySet<string>,
  now: number,
): string[] {
  return files
    .filter((f) => {
      const path = `${folder}/${f.name}`;
      if (conversationExists && pointedAt.has(path)) return false;
      const made = f.created_at ? Date.parse(f.created_at) : NaN;
      return Number.isFinite(made) && now - made >= GRACE_MS;
    })
    .map((f) => `${folder}/${f.name}`);
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== 'POST') return reply(405, { error: 'POST only' });
  const secret = deps.get('DISPATCH_SECRET');
  if (!secret) return reply(503, { error: 'not set up: DISPATCH_SECRET is missing' });
  if (request.headers.get('x-dispatch-secret') !== secret) return reply(401, { error: 'unauthorized' });
  const base = deps.get('SUPABASE_URL');
  const key = deps.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!base || !key) return reply(503, { error: 'not set up: no service key' });
  const auth = { apikey: key, Authorization: `Bearer ${key}` };

  // One column of one table, every row, page by page. The server may cap a page below what is asked, so the total it reports is
  // what says when to stop; a failure, a missing total or a page that stops short is `null`, and the sweep stops.
  const column = async (path: string, name: string, extra = ''): Promise<string[] | null> => {
    const out: string[] = [];
    for (let offset = 0, total = Infinity; offset < total; ) {
      const res = await deps.fetch(`${base}/rest/v1/${path}?select=${name}${extra}&order=${name}&limit=${PAGE}&offset=${offset}`, {
        headers: { ...auth, Prefer: 'count=exact' },
      });
      if (!res.ok) return null;
      total = Number(res.headers.get('content-range')?.split('/')[1]);
      if (!Number.isFinite(total)) return null;
      const rows = (await res.json()) as Record<string, string>[];
      if (rows.length === 0 && offset < total) return null;
      for (const row of rows) out.push(String(row[name]));
      offset += rows.length;
    }
    return out;
  };

  const list = async (bucket: string, prefix: string) => {
    const out: { name: string; id: string | null; created_at: string | null }[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const r = await deps.fetch(`${base}/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: { ...auth, ...JSON_HEADERS },
        body: JSON.stringify({ prefix, limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } }),
      });
      if (!r.ok) return null;
      const page = (await r.json()) as { name: string; id: string | null; created_at: string | null }[];
      out.push(...page);
      if (page.length < PAGE) return out;
    }
  };

  // Read it all first.
  const conversationIds = await column('conversations', 'id');
  if (!conversationIds) return reply(502, { error: 'could not read the conversations' });
  const live = new Set(conversationIds);

  const plan: { bucket: string; remove: string[] }[] = [];
  let folderCount = 0;
  const now = deps.now();
  for (const b of BUCKETS) {
    const refs = await column(b.table, b.column, `&${b.filter}`);
    if (!refs) return reply(502, { error: 'could not read what the files belong to' });
    const pointedAt = new Set(refs);
    const top = await list(b.bucket, '');
    if (!top) return reply(502, { error: 'could not list a bucket' });
    // Folders are the entries with no id at the top of a bucket.
    const folders = top.filter((e) => e.id === null).map((e) => e.name);
    folderCount += folders.length;
    const remove: string[] = [];
    for (const folder of folders) {
      const files = await list(b.bucket, folder);
      if (!files) return reply(502, { error: 'could not list a folder' });
      remove.push(...toRemove(folder, files.filter((f) => f.id !== null), live.has(folder), pointedAt, now));
    }
    plan.push({ bucket: b.bucket, remove });
  }

  // Then remove.
  let removed = 0;
  let failed = 0;
  for (const { bucket, remove } of plan) {
    for (let i = 0; i < remove.length; i += 100) {
      const batch = remove.slice(i, i + 100);
      const d = await deps.fetch(`${base}/storage/v1/object/${bucket}`, {
        method: 'DELETE',
        headers: { ...auth, ...JSON_HEADERS },
        body: JSON.stringify({ prefixes: batch }),
      });
      if (d.ok) removed += batch.length;
      else failed++;
    }
  }
  console.log(`sweep-message-files: ${folderCount} folders, ${removed} files removed, ${failed} failures`);
  return reply(200, { folders: folderCount, removed, failed });
}
