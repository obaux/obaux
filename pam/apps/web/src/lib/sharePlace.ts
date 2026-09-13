'use client';

/**
 * Hand a place to somebody else.
 *
 * The phone's own share sheet when there is one, which is every modern phone:
 * it reaches whichever app the two people already use — a text, WhatsApp,
 * anything — rather than PAM deciding for them. On a desktop browser without
 * it, the text goes to the clipboard instead, which is what a person would
 * have done by hand anyway.
 *
 * What gets shared is the name and the address, not a link into PAM. A PAM link
 * is useless to somebody without an account, and a member sharing a place is
 * usually telling a friend or a cousin where to go, not recruiting them. The
 * address is the useful part, and it is already public information.
 *
 * Never throws: a cancelled share sheet rejects, and somebody changing their
 * mind is not an error worth a notice.
 */
export async function sharePlace(name: string, address?: string | null): Promise<boolean> {
  const text = address ? `${name}, ${address}` : name;

  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: name, text });
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Cancelled, denied, or unavailable. All three mean the same thing here.
  }
  return false;
}
