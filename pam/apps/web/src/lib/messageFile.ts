'use client';

/**
 * A document in a conversation (D-399, 0080): a PDF or a Word file.
 *
 * Stored privately at `message-files/<conversation id>/<random>.<ext>` — the
 * only folder the database lets a person in that conversation write — under
 * a random name; what it was called goes in the message (`attachment_name`)
 * for showing. Unlike a photo, a document is not downloaded with the
 * conversation: the other person sees its name and size, and it is fetched
 * with their own sign-in only when they tap it — a 6 MB lease is not
 * something to spend somebody's data plan on unasked.
 *
 * A Google Doc is not a file — it is a link to Google. `googleLinkIn` finds
 * one in a message so the conversation can show it as a card (D-399).
 */
const BUCKET = 'message-files';

/** 10 MB, the bucket's own limit (0080). */
export const MESSAGE_FILE_LIMIT = 10 * 1024 * 1024;

const TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

export type MessageFileKind = 'pdf' | 'word';

/** What the file picker and a drop accept: PDF and Word, by type and by name. */
export const MESSAGE_FILE_ACCEPT = ['.pdf', '.doc', '.docx', ...Object.values(TYPES)].join(',');

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

/**
 * The type Pam stores a document as, or null when it is not one Pam takes.
 * A phone often hands over a Word file with no type at all, so the name's
 * ending decides when the type is missing.
 */
export function messageFileType(file: { readonly name: string; readonly type: string }): string | null {
  const known = Object.values(TYPES) as readonly string[];
  if (known.includes(file.type)) return file.type;
  if (file.type && file.type !== 'application/octet-stream') return null;
  const ext = extensionOf(file.name);
  return ext in TYPES ? TYPES[ext as keyof typeof TYPES] : null;
}

/** PDF or Word, from the name (what the other person's screen has to go on). */
export function messageFileKind(name: string): MessageFileKind {
  return extensionOf(name) === 'pdf' ? 'pdf' : 'word';
}

/** "240 KB", "1.2 MB" — in the reader's language. */
export function formatFileSize(bytes: number, locale: string): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return new Intl.NumberFormat(locale, { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 }).format(mb);
  }
  return new Intl.NumberFormat(locale, { style: 'unit', unit: 'kilobyte', maximumFractionDigits: 0 }).format(
    Math.max(1, Math.round(bytes / 1024)),
  );
}

/** A name for showing: no folders, no control characters, at most 200 long (0080's rule). */
export function displayFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const clean = [...base].filter((c) => c >= ' ' && c !== '\u007f').join('').trim();
  return (clean || 'document').slice(0, 200);
}

/** Stores a document in the conversation's folder; its path, or null. */
export async function uploadMessageFile(conversationId: string, file: File): Promise<string | null> {
  const type = messageFileType(file);
  if (!type) return null;
  try {
    const { createClient } = await import('./supabase');
    const ext = extensionOf(file.name) || (type === TYPES.pdf ? 'pdf' : 'docx');
    const path = `${conversationId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient().storage.from(BUCKET).upload(path, file, { contentType: type, upsert: false });
    return error ? null : path;
  } catch {
    return null;
  }
}

/** Takes back a document whose message never went in. Allowed only while no message uses it. */
export async function removeUnsentFile(path: string): Promise<void> {
  try {
    const { createClient } = await import('./supabase');
    await createClient().storage.from(BUCKET).remove([path]);
  } catch {
    // Left behind, it is still private and still only the conversation's.
  }
}

/** Downloads a document with the person's sign-in; an on-phone link to it, or null. */
export async function loadMessageFile(path: string): Promise<string | null> {
  try {
    const { createClient } = await import('./supabase');
    const { data } = await createClient().storage.from(BUCKET).download(path);
    return data ? URL.createObjectURL(data) : null;
  } catch {
    return null;
  }
}

/**
 * Hands a downloaded document to the phone under its own name: a PDF opens
 * in the phone's viewer or a new tab; a Word file is saved for the app that
 * opens it. A link with `download`, not `window.open` — after the wait for
 * the download, a phone treats a new window as a pop-up and blocks it.
 */
export function handOver(url: string, name: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export type GoogleLinkKind = 'doc' | 'sheet' | 'slides' | 'form' | 'drive';

/**
 * The first Google Docs, Sheets, Slides, Forms or Drive link in a message, or
 * null. Only https links on Google's own hosts — this is what decides that a
 * card saying "Google Doc" is telling the truth.
 */
export function googleLinkIn(body: string | null): { readonly url: string; readonly kind: GoogleLinkKind } | null {
  if (!body) return null;
  for (const match of body.matchAll(/https:\/\/[^\s<>"]+/g)) {
    let url: URL;
    try {
      url = new URL(match[0].replace(/[).,;!?]+$/, ''));
    } catch {
      continue;
    }
    if (url.hostname === 'docs.google.com') {
      const section = url.pathname.split('/')[1];
      const kind: GoogleLinkKind | null =
        section === 'document'
          ? 'doc'
          : section === 'spreadsheets'
            ? 'sheet'
            : section === 'presentation'
              ? 'slides'
              : section === 'forms'
                ? 'form'
                : null;
      if (kind) return { url: url.toString(), kind };
    }
    if (url.hostname === 'drive.google.com') return { url: url.toString(), kind: 'drive' };
  }
  return null;
}

/** What goes out with a message: nothing, a photo, or a document (D-394, D-399). */
export type OutgoingAttachment =
  // `isReady`: already shrunk to a JPEG when it was picked (D-408), so it is
  // not re-drawn on the way out.
  | { readonly kind: 'photo'; readonly file: Blob; readonly isReady?: boolean }
  | { readonly kind: 'file'; readonly file: File };

/** A document in a message, as the conversation shows it before it is opened. */
export interface MessageFile {
  readonly path: string;
  readonly name: string;
  readonly bytes: number;
}
