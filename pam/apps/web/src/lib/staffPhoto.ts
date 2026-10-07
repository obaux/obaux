'use client';

/**
 * A staff member's own photo (D-345, 0074).
 *
 * The picked file is shrunk on the phone first — a camera photo is 3–8 MB and
 * a face on Pam is shown at 40–96px — to a 512px square, centre-cropped, as
 * WebP (about 40 KB), so it uploads quickly on a slow connection and fits the
 * bucket's 2 MB cap however big the original was. Then it goes to
 * `staff-photos/<user id>/<time>.webp` (the only folder the account may
 * write) and `profiles.photo_url` points at it.
 *
 * Returns the new URL, or null with nothing changed when anything fails —
 * the screen says so and the old photo stays.
 */
const SIDE = 512;

async function shrink(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = SIDE;
    canvas.height = SIDE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIDE, SIDE);
    bitmap.close();
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
  } catch {
    return null;
  }
}

export async function uploadStaffPhoto(userId: string, file: File): Promise<string | null> {
  const blob = await shrink(file);
  if (!blob) return null;
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    const path = `${userId}/${Date.now()}.webp`;
    const { error: upError } = await supabase.storage
      .from('staff-photos')
      .upload(path, blob, { contentType: blob.type || 'image/webp', upsert: false });
    if (upError) return null;
    const { data } = supabase.storage.from('staff-photos').getPublicUrl(path);
    const url = data.publicUrl;
    const { error } = await supabase.from('profiles').update({ photo_url: url }).eq('id', userId);
    if (error) return null;
    return url;
  } catch {
    return null;
  }
}

/** The shrunk picture as a local URL, to show at once while it uploads. */
export function previewOf(file: File): string {
  return URL.createObjectURL(file);
}
