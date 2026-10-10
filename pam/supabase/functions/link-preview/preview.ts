// The parts of the link-preview function that decide things, kept free of
// Deno and the network so they are tested in packages/config/test like the
// SMS renderer is (D-407).
//
// Three jobs:
//   1. Which link in a message gets a preview — the same rule the app uses.
//   2. Whether an address is one Pam's server may open at all: https, a
//      public name, never a private, local or reserved address. The function
//      opens pages on a member's say-so; this is what keeps "a link" from
//      meaning "a look inside somebody's network" (SSRF).
//   3. Reading a page's title, site name and picture out of its HTML.

export const MAX_HTML_BYTES = 512 * 1024;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const TIMEOUT_MS = 5000;
export const MAX_REDIRECTS = 3;

const LINK = /https?:\/\/[^\s<>"]+/gi;

function parsed(raw: string): URL | null {
  try {
    return new URL(raw.replace(/[).,;:!?'"\]]+$/, ''));
  } catch {
    return null;
  }
}

/** Google Docs, Sheets, Slides, Forms and Drive links are documents, not pages (D-399). */
export function isGoogleFile(url: URL): boolean {
  return url.hostname === 'docs.google.com' || url.hostname === 'drive.google.com';
}

/**
 * The link a message's preview is for: its first web link — unless it has a
 * Google document in it, which the app shows as a document instead. Only
 * https is opened.
 */
export function previewableLink(body: string | null): string | null {
  if (!body) return null;
  const links = [...body.matchAll(LINK)].map((m) => parsed(m[0])).filter((u): u is URL => u !== null);
  if (links.some(isGoogleFile)) return null;
  const first = links[0];
  return first && first.protocol === 'https:' ? first.toString() : null;
}

// ---------------------------------------------------------------------------
// Addresses.

function v4Parts(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  return nums.every((n) => n >= 0 && n <= 255) ? nums : null;
}

function privateV4(parts: readonly number[]): boolean {
  const [a = 0, b = 0, c = 0] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

/** Expands an IPv6 address to eight 16-bit groups, or null. */
function v6Groups(ip: string): number[] | null {
  let text = ip.replace(/^\[|\]$/g, '').toLowerCase();
  const zone = text.indexOf('%');
  if (zone >= 0) text = text.slice(0, zone);
  // A trailing dotted IPv4 (::ffff:10.0.0.1) becomes two groups.
  const tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (tail) {
    const v4 = v4Parts(tail[1]!);
    if (!v4) return null;
    text = text.slice(0, -tail[1]!.length) + `${((v4[0]! << 8) | v4[1]!).toString(16)}:${((v4[2]! << 8) | v4[3]!).toString(16)}`;
  }
  const halves = text.split('::');
  if (halves.length > 2) return null;
  const read = (s: string) => (s ? s.split(':').map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN)) : []);
  const head = read(halves[0]!);
  const rest = halves.length === 2 ? read(halves[1]!) : [];
  const fill = halves.length === 2 ? 8 - head.length - rest.length : 0;
  if (fill < 0) return null;
  const groups = [...head, ...Array(fill).fill(0), ...rest];
  return groups.length === 8 && groups.every((g) => Number.isInteger(g)) ? groups : null;
}

/**
 * True for any address Pam's server must not open: private, loopback,
 * link-local, carrier-grade NAT, documentation, multicast and reserved
 * ranges, in IPv4 and IPv6 (including IPv4 written inside IPv6). Anything
 * that is not a valid address is treated as private.
 */
export function isPrivateAddress(ip: string): boolean {
  const v4 = v4Parts(ip);
  if (v4) return privateV4(v4);
  const g = v6Groups(ip);
  if (!g) return true;
  const embedded = [g[6]! >> 8, g[6]! & 255, g[7]! >> 8, g[7]! & 255];
  if (g.slice(0, 7).every((x) => x === 0)) return true; // :: and ::1
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return privateV4(embedded); // ::ffff:a.b.c.d
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return privateV4(embedded); // 64:ff9b::/96
  if ((g[0]! & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g[0]! & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0]! & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentation
  if (g[0] === 0x2002) return privateV4([g[1]! >> 8, g[1]! & 255, g[2]! >> 8, g[2]! & 255]); // 6to4
  return false;
}

export function isAddressLiteral(host: string): boolean {
  return v4Parts(host) !== null || host.startsWith('[') || host.includes(':');
}

const LOCAL_SUFFIXES = ['.localhost', '.local', '.internal', '.intranet', '.lan', '.home', '.corp', '.home.arpa', '.arpa'];

/**
 * Whether an address may be opened, before any name is looked up: https on
 * the usual port, no user name or password in it, a public-looking name (it
 * has a dot and is not a local one), and — if it is written as a number —
 * a public number. The function also checks what the name resolves to.
 */
export function addressAllowed(url: URL): boolean {
  if (url.protocol !== 'https:') return false;
  if (url.port !== '' && url.port !== '443') return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host === 'localhost') return false;
  if (isAddressLiteral(host)) return !isPrivateAddress(host);
  if (!host.includes('.')) return false;
  if (LOCAL_SUFFIXES.some((s) => host.endsWith(s))) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Pages.

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi, (whole, name: string) => {
    const lower = name.toLowerCase();
    if (lower.startsWith('#x')) {
      const code = parseInt(lower.slice(2), 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    if (lower.startsWith('#')) {
      const code = Number(lower.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED[lower] ?? whole;
  });
}

/** One line of plain text, at most `max` characters, or null. */
export function cleanText(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  // eslint-disable-next-line no-control-regex
  const one = decodeEntities(text).replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!one) return null;
  const chars = [...one];
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : one;
}

function attributes(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-zA-Z_:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
    out[m[1]!.toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return out;
}

export interface PagePreview {
  readonly title: string | null;
  readonly site: string | null;
  /** An https address for the page's picture, or null. */
  readonly image: string | null;
}

/**
 * The title, site name and picture a page offers for previews (Open Graph,
 * then Twitter's tags, then <title>). Reads only the page's head.
 */
export function parsePreview(html: string, pageUrl: string): PagePreview {
  const end = html.search(/<\/head\s*>|<body[\s>]/i);
  const head = end > 0 ? html.slice(0, end) : html.slice(0, MAX_HTML_BYTES);
  const meta: Record<string, string> = {};
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attributes(m[0]);
    const key = (a['property'] ?? a['name'] ?? '').toLowerCase();
    if (key && a['content'] !== undefined && meta[key] === undefined) meta[key] = a['content'];
  }
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1] ?? null;
  const title = cleanText(meta['og:title'] ?? meta['twitter:title'] ?? titleTag, 300);

  let host: string | null = null;
  try {
    host = new URL(pageUrl).hostname.replace(/^www\./, '');
  } catch {
    host = null;
  }
  const site = cleanText(meta['og:site_name'] ?? host, 253);

  const raw =
    meta['og:image:secure_url'] ?? meta['og:image'] ?? meta['og:image:url'] ?? meta['twitter:image'] ?? meta['twitter:image:src'] ?? null;
  let image: string | null = null;
  if (raw) {
    try {
      const resolved = new URL(decodeEntities(raw.trim()), pageUrl);
      image = resolved.protocol === 'https:' ? resolved.toString() : null;
    } catch {
      image = null;
    }
  }
  return { title, site, image };
}

/** The file ending a picture is kept under, from what the other site said it is; null if it is not one we keep. */
export function imageExtension(contentType: string | null): 'jpg' | 'png' | 'webp' | 'gif' | null {
  const type = (contentType ?? '').split(';')[0]!.trim().toLowerCase();
  return type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : type === 'image/gif' ? 'gif' : null;
}

export function isHtml(contentType: string | null): boolean {
  const type = (contentType ?? '').split(';')[0]!.trim().toLowerCase();
  return type === 'text/html' || type === 'application/xhtml+xml';
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The message ids a request names: real ids only, ten at most. */
export function messageIdsFrom(body: unknown): string[] {
  const ids = (body as { message_ids?: unknown } | null)?.message_ids;
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id): id is string => typeof id === 'string' && UUID.test(id)))].slice(0, 10);
}
