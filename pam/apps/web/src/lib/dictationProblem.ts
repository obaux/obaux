/**
 * Why speaking a message did not start, said in the conversation (W4, D-603).
 *
 * The browser's speech recogniser reports a failure as an `error` event with a
 * short code. Before this, Pam listened for none of them: a refused microphone,
 * no connection, or a browser with no recogniser all looked like a mic button
 * that did nothing. Each code that means "this did not work" maps to one of the
 * lines `messages.thread.dictate.problem.<kind>.*`; the codes that are not a
 * failure (the person stopped it, or said nothing) map to `null` and show nothing.
 */
export type DictationProblem = 'blocked' | 'noMic' | 'offline' | 'language' | 'unsupported' | 'failed';

export function dictationProblemFor(error: string): DictationProblem | null {
  switch (error) {
    // Stopped on purpose, or nothing was said: not a failure to start.
    case 'aborted':
    case 'no-speech':
      return null;
    // The microphone, or the browser's speech service, was refused.
    case 'not-allowed':
    case 'service-not-allowed':
      return 'blocked';
    case 'audio-capture':
      return 'noMic';
    // Recognition is done by a service on the internet in most browsers.
    case 'network':
      return 'offline';
    case 'language-not-supported':
      return 'language';
    default:
      return 'failed';
  }
}

/** How long a tap may go without the browser saying it started or failed. */
export const DICTATION_START_MS = 10_000;
