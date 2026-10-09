/**
 * Link previews (Will, 9 October, D-407): a link in a message shows on Stuff
 * shared with the page's title and picture.
 *
 * The phone never opens the other site to make one. Pam's server does — the
 * `link-preview` Edge Function, asked with the person's own sign-in — once
 * per message, and keeps the title and a copy of the picture in Pam's
 * storage (0081), readable by the two people in the conversation only. So
 * here: ask for previews (on send, and for older links when Stuff shared
 * opens), read them back, and download their pictures with the person's
 * sign-in, as photos are (D-394).
 *
 * Until 0081 is on the live project the reads fail and the asks are refused;
 * every link then simply shows as its address with a globe.
 */

const BUCKET = 'link-previews';
const LINK = /https?:\/\/[^\s<>"]+/gi;

function parsed(raw: string): URL | null {
  try {
    return new URL(raw.replace(/[).,;:!?'"\]]+$/, ''));
  } catch {
    return null;
  }
}

function isGoogleFile(url: URL): boolean {
  return url.hostname === 'docs.google.com' || url.hostname === 'drive.google.com';
}

/**
 * The web link a message shares — its first http(s) link — or null. A
 * message with a Google document in it is a document instead (D-399).
 */
export function sharedLinkIn(body: string | null): URL | null {
  if (!body) return null;
  const links = [...body.matchAll(LINK)].map((m) => parsed(m[0])).filter((u): u is URL => u !== null);
  if (links.some(isGoogleFile)) return null;
  return links[0] ?? null;
}

/** Whether Pam's server would make a preview for this message (https only — the function's own rule). */
export function wantsPreview(body: string | null): boolean {
  return sharedLinkIn(body)?.protocol === 'https:';
}

/** "example-library.org/events/resume" — a link shown without a title. */
export function shortLink(url: URL): string {
  const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
  return `${url.hostname.replace(/^www\./, '')}${path}`;
}

export interface LinkPreview {
  readonly messageId: string;
  readonly title: string | null;
  readonly site: string | null;
  readonly imagePath: string | null;
}

/** The previews kept for a conversation, by message. Empty if there are none, or no table yet. */
export async function loadLinkPreviews(conversationId: string): Promise<Record<string, LinkPreview>> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient()
      .from('message_link_previews')
      .select('message_id, title, site, image_path')
      .eq('conversation_id', conversationId);
    if (error || !data) return {};
    return Object.fromEntries(
      (data as { message_id: string; title: string | null; site: string | null; image_path: string | null }[]).map((row) => [
        row.message_id,
        { messageId: row.message_id, title: row.title, site: row.site, imagePath: row.image_path },
      ]),
    );
  } catch {
    return {};
  }
}

/** Preview pictures, downloaded with the person's sign-in, as on-phone links by path. */
export async function loadPreviewImages(paths: readonly string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths)];
  if (unique.length === 0) return {};
  try {
    const { createClient } = await import('./supabase');
    const bucket = createClient().storage.from(BUCKET);
    const loaded = await Promise.all(
      unique.map(async (path) => {
        const { data } = await bucket.download(path);
        return data ? ([path, URL.createObjectURL(data)] as const) : null;
      }),
    );
    return Object.fromEntries(loaded.filter((row): row is readonly [string, string] => row !== null));
  } catch {
    return {};
  }
}

/**
 * Asks Pam's server to make previews for these messages, ten at a time.
 * Resolves to how many it made; never throws — a preview is a nicety.
 */
export async function requestLinkPreviews(messageIds: readonly string[]): Promise<number> {
  if (messageIds.length === 0) return 0;
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    let made = 0;
    for (let i = 0; i < messageIds.length; i += 10) {
      const { data, error } = await supabase.functions.invoke('link-preview', {
        body: { message_ids: messageIds.slice(i, i + 10) },
      });
      if (error) break;
      made += Number((data as { made?: number } | null)?.made ?? 0);
    }
    return made;
  } catch {
    return 0;
  }
}
