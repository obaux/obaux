// sweep-staff-photos: removes every staff photo no account uses (Lena's privacy guard, D-587; D-345).
// The handler, with everything it touches passed in so it can be tested; index.ts wires it to Deno.
//
// Why a sweep. An account is deleted by the Pam team, when somebody asks ("Delete my account" says "Call Pam"):
// the profile row goes, and nothing in the database can remove a file from Storage. Removing the row from
// `storage.objects` would leave the file itself. And when a photo is changed, the app removes the old file, but
// the phone can lose its connection in between. So once a night this keeps, in each person's folder of the
// `staff-photos` bucket, only the file their profile points at:
//
//   1. A folder whose account is gone, or whose account has no photo now, is emptied.
//   2. In a folder whose account has a photo, every other file goes.
//   3. A file younger than an hour is left alone: the app uploads first and points the profile at it second,
//      so a file seen between the two is a photo being saved, not a leftover.
//
// The rules that matter:
//   * It is not a delete button: a call needs the shared secret (DISPATCH_SECRET, x-dispatch-secret), as the other
//     clocks do. Without the secret set up it does not run at all.
//   * It never logs a name, a path or a person's id: counts only.

const JSON_HEADERS = { 'Content-Type': 'application/json' };
export const BUCKET = 'staff-photos';
/** A file this young may be a photo being saved (uploaded, profile not yet pointed at it). */
export const GRACE_MS = 60 * 60 * 1000;
const PAGE = 1000;

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

/** The path inside the bucket a profile's photo URL points at, or null if it points somewhere else. */
export function pathOf(photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  const marker = `/object/public/${BUCKET}/`;
  const at = photoUrl.indexOf(marker);
  return at === -1 ? null : decodeURIComponent(photoUrl.slice(at + marker.length).split('?')[0]!);
}

/**
 * The files to remove from one folder: all but the one its account's photo points at, and none younger than the
 * grace period. `kept` is null when the folder's account is gone or has no photo.
 */
export function toRemove(folder: string, files: readonly StoredFile[], kept: string | null, now: number): string[] {
  return files
    .filter((f) => {
      const path = `${folder}/${f.name}`;
      if (path === kept) return false;
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

  // Every photo an account points at, by account, page by page: a page missed would read as "no photo" and
  // empty a folder that is in use, so any failure stops the sweep before it removes anything.
  // The server may cap a page below what is asked, so the total it reports is what says when to stop.
  const kept = new Map<string, string>();
  for (let offset = 0, total = Infinity; offset < total; ) {
    const res = await deps.fetch(
      `${base}/rest/v1/profiles?select=id,photo_url&photo_url=not.is.null&order=id&limit=${PAGE}&offset=${offset}`,
      { headers: { ...auth, Prefer: 'count=exact' } },
    );
    if (!res.ok) return reply(502, { error: 'could not read the profiles' });
    total = Number(res.headers.get('content-range')?.split('/')[1]);
    if (!Number.isFinite(total)) return reply(502, { error: 'the profiles came without a count' });
    const rows = (await res.json()) as { id: string; photo_url: string | null }[];
    if (rows.length === 0 && offset < total) return reply(502, { error: 'the profiles stopped short' });
    for (const row of rows) {
      const path = pathOf(row.photo_url);
      if (path?.startsWith(`${row.id}/`)) kept.set(row.id, path);
    }
    offset += rows.length;
  }

  const list = async (prefix: string): Promise<{ name: string; id: string | null; created_at: string | null }[] | null> => {
    const out: { name: string; id: string | null; created_at: string | null }[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const r = await deps.fetch(`${base}/storage/v1/object/list/${BUCKET}`, {
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

  // Folders are the entries with no id at the top of the bucket.
  const top = await list('');
  if (!top) return reply(502, { error: 'could not list the bucket' });
  const folders = top.filter((e) => e.id === null).map((e) => e.name);
  const now = deps.now();
  let removed = 0;
  let failed = 0;
  for (const folder of folders) {
    const files = await list(folder);
    if (!files) {
      failed++;
      continue;
    }
    const gone = toRemove(folder, files.filter((f) => f.id !== null), kept.get(folder) ?? null, now);
    for (let i = 0; i < gone.length; i += 100) {
      const batch = gone.slice(i, i + 100);
      const d = await deps.fetch(`${base}/storage/v1/object/${BUCKET}`, {
        method: 'DELETE',
        headers: { ...auth, ...JSON_HEADERS },
        body: JSON.stringify({ prefixes: batch }),
      });
      if (d.ok) removed += batch.length;
      else failed++;
    }
  }
  console.log(`sweep-staff-photos: ${folders.length} folders, ${removed} files removed, ${failed} failures`);
  return reply(200, { folders: folders.length, removed, failed });
}
