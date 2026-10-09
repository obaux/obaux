'use client';

/**
 * A photo in a conversation (D-394, 0079).
 *
 * Shrunk on the phone before it goes anywhere: a camera photo is 3–8 MB, and
 * the person sending it may be on a cheap data plan. The longest side comes
 * down to 1600px, re-drawn on a canvas and saved as a JPEG — and re-drawing
 * is also what strips what a phone writes into a photo besides the picture:
 * where it was taken, when, on what phone. The photo is turned the right way
 * up first (`imageOrientation: 'from-image'`), since that information goes
 * with the rest.
 *
 * It is stored privately at `message-photos/<conversation id>/<random>.jpg`
 * (the only folder the database lets a person in that conversation write)
 * and read back by downloading it with the person's own sign-in, then shown
 * from the phone's memory. Never as a link: a signed link works for anyone
 * holding it until it runs out, and a photo here is nobody else's to open.
 */
const LONG_EDGE = 1600;
const BUCKET = 'message-photos';

/**
 * The photos Pam takes (Will, 9 October, D-408: "Images, any jpeg, png. Or
 * iPhone photo"): JPEG, PNG, and an iPhone's own HEIC/HEIF. Whatever comes
 * in, a JPEG goes out.
 *
 * The photo button asks for JPEG or PNG only. That is deliberate: an iPhone
 * then hands over its HEIC photos already turned into JPEGs, which every
 * phone can open. A HEIC that arrives some other way — dropped or pasted —
 * is opened by the browser if it can (Safari can); where it cannot, the
 * person is told in words rather than sending nothing.
 */
export const MESSAGE_PHOTO_ACCEPT = 'image/jpeg,image/png';

export type PhotoType = 'jpeg' | 'png' | 'heic';

export function photoType(file: { readonly name: string; readonly type: string }): PhotoType | null {
  const type = file.type.toLowerCase();
  if (type === 'image/jpeg' || type === 'image/jpg' || type === 'image/pjpeg') return 'jpeg';
  if (type === 'image/png') return 'png';
  if (type === 'image/heic' || type === 'image/heif' || type === 'image/heic-sequence' || type === 'image/heif-sequence') return 'heic';
  if (type && type !== 'application/octet-stream') return null;
  const dot = file.name.lastIndexOf('.');
  const ext = dot === -1 ? '' : file.name.slice(dot + 1).toLowerCase();
  return ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext === 'png' ? 'png' : ext === 'heic' || ext === 'heif' ? 'heic' : null;
}

export async function shrinkPhoto(file: Blob): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // A JPEG has no see-through: a PNG's clear parts go white, not black.
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  } catch {
    return null;
  }
}

/** Stores a shrunk photo in the conversation's folder; its path, or null. */
export async function uploadMessagePhoto(conversationId: string, photo: Blob): Promise<string | null> {
  try {
    const { createClient } = await import('./supabase');
    const path = `${conversationId}/${crypto.randomUUID()}.jpg`;
    const { error } = await createClient()
      .storage.from(BUCKET)
      .upload(path, photo, { contentType: 'image/jpeg', upsert: false });
    return error ? null : path;
  } catch {
    return null;
  }
}

/**
 * Takes back a photo whose message never went in (the upload landed, the
 * insert did not). The database allows this only while no message uses it.
 */
export async function removeUnsentPhoto(path: string): Promise<void> {
  try {
    const { createClient } = await import('./supabase');
    await createClient().storage.from(BUCKET).remove([path]);
  } catch {
    // Left behind, it is still private and still only the conversation's.
  }
}

/**
 * Stored photos, downloaded with the person's sign-in and turned into
 * on-phone links, by path. The database decides which ones come back
 * (0079); a photo it refuses is simply left out.
 */
export async function loadPhotos(paths: readonly string[]): Promise<Record<string, string>> {
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
