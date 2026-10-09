/**
 * Messages, read in the reader's language (Will, 9 October 2026, D-423).
 *
 * Staff may write in English or Spanish; the person reading sees the message
 * in their own language, labelled "Translated", with a link under it to show
 * what was written. Whose language is whose is not a place — everybody in a
 * city speaks something different — so it is the reader's own choice
 * (`profiles.preferred_language`) against what the message turns out to be
 * written in, found by the translation service, not guessed from where
 * anybody is.
 *
 * **Off.** This switch is the app's half of the promise; the function's own
 * (`MESSAGE_TRANSLATION=on`, a secret on the project) is the other. Both must
 * be on for a word to leave Pam. They stay off until what is owed has been
 * done (docs/before-launch.md): the service's terms say it keeps nothing and
 * learns nothing from what it is sent, its key is set, and members have been
 * told first.
 *
 * **Tied to the privacy page.** Sending somebody's message to another company
 * is something the privacy page has to say, and while this is off, the page
 * must not claim it (tests: legal.test.ts). Turning this on adds the section
 * `privacy.s.translation` to the page in the same change; there is no way to
 * have one without the other.
 */
export const MESSAGE_TRANSLATION = {
  enabled: false,
} as const;

/** How many words a reader has been told about, at most, in one request. Mirrors the function. */
export const TRANSLATION_BATCH = 30;
