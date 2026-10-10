import { stripIsolates } from '@pam/config';

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

/**
 * How long the copy icon shows its tick and its tooltip before it goes back
 * to a copy icon (Will, 9 October, D-417: "resets after 5 seconds"). The same
 * for "could not copy", which tells you what to do instead.
 */
export const COPY_STATUS_MS = 5000;

/**
 * Copies `text`; true when the clipboard took it. Call it inside a tap: that
 * is the only time Safari allows it. What is copied is pasted somewhere else,
 * so it carries none of the invisible isolates `t` puts round a value in
 * Arabic (D-435).
 */
export async function copyLink(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) return false;
    await navigator.clipboard.writeText(stripIsolates(text));
    return true;
  } catch {
    // No clipboard: the text is on the screen, to copy by hand.
    return false;
  }
}
