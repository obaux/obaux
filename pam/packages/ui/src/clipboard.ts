/**
 * Writing to the clipboard, and how long a status about it stays up.
 *
 * Moved out of `BringFriend` (D-416) so a small button that copies a section
 * of text can use it without pulling a whole drawer into its bundle.
 * `BringFriend` still re-exports both, so nothing that imported them from
 * there changes.
 */

/** How long "Link copied" / "Copied" stays up (D-337). */
export const COPIED_MS = 3000;

/** How long "could not copy" stays up: longer, because it tells you what to do instead. */
export const COPY_FAILED_MS = 6000;

/**
 * Copies `text`; true when the clipboard took it. Call it inside a tap: that
 * is the only time Safari allows it.
 */
export async function copyLink(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // No clipboard: the text is on the screen, to copy by hand.
    return false;
  }
}
