// Link previews (D-407). Called by the app with a person's sign-in and up to
// ten message ids; for each message with a web link and no preview yet, it
// opens the page once, keeps its title, site name and picture, and is done.
// The member's phone never visits the page to draw the preview: Pam's server
// does, and the picture is copied into Pam's own storage (`link-previews`),
// so looking at the list contacts nobody else.
//
// Who may ask is the database's call, not this function's: it asks
// `link_preview_targets()` *as the person*, which answers only for messages
// in their own conversations (0081). Only then does it use the service role,
// to write what it found.
//
// What it will open is preview.ts's call: https only, a public name, never a
// private or local address — checked again after every redirect and against
// what the name resolves to — 5 seconds and 512 KB for a page, 2 MB for a
// picture. A page it cannot read is remembered as such ('none'), so nobody
// can make it knock on the same door twice.

import {
  MAX_HTML_BYTES,
  MAX_IMAGE_BYTES,
  MAX_REDIRECTS,
  TIMEOUT_MS,
  addressAllowed,
  imageExtension,
  isAddressLiteral,
  isHtml,
  isPrivateAddress,
  messageIdsFrom,
  parsePreview,
  previewableLink,
} from './preview.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const USER_AGENT = 'Mozilla/5.0 (compatible; PamLinkPreview/1.0; +https://web-ten-umber-88.vercel.app)';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

interface Target {
  message_id: string;
  conversation_id: string;
  body: string | null;
  has_preview: boolean;
}

/** Every address a name resolves to is public. Where the runtime cannot look names up, the name checks stand alone. */
async function resolvesPublic(host: string): Promise<boolean> {
  if (isAddressLiteral(host)) return !isPrivateAddress(host);
  const resolve = (Deno as unknown as { resolveDns?: (h: string, t: 'A' | 'AAAA') => Promise<string[]> }).resolveDns;
  if (typeof resolve !== 'function') return true;
  const [v4, v6] = await Promise.all([
    resolve(host, 'A').catch(() => [] as string[]),
    resolve(host, 'AAAA').catch(() => [] as string[]),
  ]);
  const all = [...v4, ...v6];
  return all.length > 0 && all.every((ip) => !isPrivateAddress(ip));
}

/** Fetches an address the safe way: checked, redirects followed by hand and checked again, on a deadline. */
async function safeFetch(start: string, accept: string, signal: AbortSignal): Promise<{ response: Response; url: string } | null> {
  let current = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      return null;
    }
    if (!addressAllowed(url) || !(await resolvesPublic(url.hostname))) return null;
    let response: Response;
    try {
      response = await fetch(url, { redirect: 'manual', signal, headers: { 'User-Agent': USER_AGENT, Accept: accept } });
    } catch {
      return null;
    }
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get('location');
      await response.body?.cancel();
      if (!next) return null;
      current = new URL(next, url).toString();
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      return null;
    }
    return { response, url: url.toString() };
  }
  return null;
}

/** Reads at most `max` bytes. `whole`: more than that is a refusal, not a cut. */
async function readUpTo(response: Response, max: number, whole: boolean): Promise<Uint8Array | null> {
  const declared = Number(response.headers.get('content-length') ?? '0');
  if (whole && declared > max) {
    await response.body?.cancel();
    return null;
  }
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      if (whole) return null;
      chunks.push(value.slice(0, value.byteLength - (size - max)));
      size = max;
      break;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.byteLength;
  }
  return out;
}

interface Found {
  status: 'ready' | 'none';
  title: string | null;
  site: string | null;
  image: { bytes: Uint8Array; type: string; ext: string } | null;
}

async function look(link: string): Promise<Found> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const page = await safeFetch(link, 'text/html,application/xhtml+xml', controller.signal);
    if (!page || !isHtml(page.response.headers.get('content-type'))) {
      await page?.response.body?.cancel();
      return { status: 'none', title: null, site: null, image: null };
    }
    const bytes = await readUpTo(page.response, MAX_HTML_BYTES, false);
    if (!bytes) return { status: 'none', title: null, site: null, image: null };
    const found = parsePreview(new TextDecoder().decode(bytes), page.url);

    let image: Found['image'] = null;
    if (found.image) {
      const picture = await safeFetch(found.image, 'image/jpeg,image/png,image/webp,image/gif', controller.signal);
      const type = picture?.response.headers.get('content-type') ?? null;
      const ext = imageExtension(type);
      if (picture && ext) {
        const data = await readUpTo(picture.response, MAX_IMAGE_BYTES, true);
        if (data && data.byteLength > 0) image = { bytes: data, type: type!.split(';')[0]!.trim(), ext };
      } else {
        await picture?.response.body?.cancel();
      }
    }
    return { status: 'ready', title: found.title, site: found.site, image };
  } catch {
    return { status: 'none', title: null, site: null, image: null };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return json({ error: 'not signed in' }, 401);

  const base = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const publicKey = request.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY');
  if (!base || !service || !publicKey) return json({ error: 'not configured' }, 500);

  const ids = messageIdsFrom(await request.json().catch(() => null));
  if (ids.length === 0) return json({ made: 0 });

  // As the person: which of these may they have previews for?
  const asked = await fetch(`${base}/rest/v1/rpc/link_preview_targets`, {
    method: 'POST',
    headers: { apikey: publicKey, Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_message_ids: ids }),
  });
  if (!asked.ok) return json({ error: 'not allowed' }, 403);
  const targets = (await asked.json()) as Target[];

  const asService = { apikey: service, Authorization: `Bearer ${service}` };
  let made = 0;
  for (const target of targets) {
    if (target.has_preview) continue;
    const link = previewableLink(target.body);
    if (!link) continue;

    const found = await look(link);
    let imagePath: string | null = null;
    if (found.image) {
      const path = `${target.conversation_id}/${target.message_id}.${found.image.ext}`;
      const stored = await fetch(`${base}/storage/v1/object/link-previews/${path}`, {
        method: 'POST',
        headers: { ...asService, 'Content-Type': found.image.type, 'x-upsert': 'true' },
        body: found.image.bytes,
      });
      if (stored.ok) imagePath = path;
    }
    const saved = await fetch(`${base}/rest/v1/message_link_previews`, {
      method: 'POST',
      headers: { ...asService, 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify({
        message_id: target.message_id,
        conversation_id: target.conversation_id,
        url: link,
        title: found.title,
        site: found.site,
        image_path: imagePath,
        status: found.status,
      }),
    });
    if (saved.ok) made += 1;
  }
  // Counts only: the addresses people share are theirs, not the log's.
  console.log(`link-preview: asked ${ids.length}, allowed ${targets.length}, made ${made}`);
  return json({ made });
});
