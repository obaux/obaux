// Turning a queued row into the words that go out.
//
// Kept apart from index.ts, and taking its copy as an argument rather than
// importing it, so the same code that renders a real message is what the tests
// render against — no Deno, no network, no second implementation to drift.

export type Locale = 'en' | 'es';

export interface Template {
  key: string;
  en: string;
  es: string;
  vars: string[];
  reviewedBy: string;
  isFirstContact?: boolean;
}

export interface Bundle {
  templates: Record<string, Template>;
  reasons: Record<string, Record<Locale, string>>;
}

export const SMS_MAX_LENGTH = 160;

// §9. The same list the config package tests against; repeated here because
// this is the last point before the words leave PAM, and a last check is only
// worth having if it holds on its own.
const FORBIDDEN = [
  /\bparole\b/i,
  /\bprobation\b/i,
  /\bprison\b/i,
  /\binmate\b/i,
  /\boffender\b/i,
  /\bconviction\b/i,
  /\breentry\b/i,
  /\bcase manager\b/i,
  /\bcaseworker\b/i,
];
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

const STOP_SUFFIX: Record<Locale, string> = {
  en: ' Reply STOP to stop texts.',
  es: ' Responda STOP para no recibir mas.',
};

/** A message that must not be sent, and why. Never quotes the offending words. */
export class UnsendableError extends Error {}

export function localeOf(value: string | null | undefined): Locale {
  return value === 'es' ? 'es' : 'en';
}

/** §9, applied to the finished words rather than to the template. */
export function assertSafe(body: string): void {
  if (!body.startsWith('PAM: ')) throw new UnsendableError('message does not identify PAM');
  if (body.length > SMS_MAX_LENGTH) {
    throw new UnsendableError(
      `message is ${body.length} characters, over the ${SMS_MAX_LENGTH} limit`,
    );
  }
  if (EMOJI.test(body)) throw new UnsendableError('message contains emoji');
  for (const pattern of FORBIDDEN) {
    if (pattern.test(body)) {
      // The word itself is not named: a log line quoting it is the same
      // disclosure in a different place.
      throw new UnsendableError('message would reveal justice involvement');
    }
  }
}

/** Renders a queued message, or explains why it must not be sent. */
export function render(
  bundle: Bundle,
  key: string,
  locale: Locale,
  vars: Record<string, string>,
): string {
  const template = bundle.templates[key];
  if (!template) throw new UnsendableError(`unknown template "${key}"`);

  // The gate. An unreviewed template is not a missing feature — it is copy
  // nobody has read yet, and PAM stays quiet until somebody has.
  if (!template.reviewedBy) {
    throw new UnsendableError(`template "${key}" has no reviewedBy — copy is not signed off`);
  }

  // The queue carries a reason KEY, never a phrase, so the wording can still
  // change after a message is waiting (0037).
  const filled: Record<string, string> = { ...vars };
  if (typeof vars.reason_key === 'string') {
    const reason = bundle.reasons[vars.reason_key];
    if (!reason) throw new UnsendableError(`unknown reason "${vars.reason_key}"`);
    filled.reason = reason[locale];
    delete filled.reason_key;
  }

  let body = template[locale];
  for (const name of template.vars) {
    const value = filled[name];
    if (value === undefined) throw new UnsendableError(`missing variable "${name}" for "${key}"`);
    body = body.replaceAll(`{${name}}`, value);
  }

  const leftover = body.match(/\{([a-zA-Z0-9_]+)\}/);
  if (leftover) throw new UnsendableError(`unfilled placeholder "${leftover[1]}" in "${key}"`);

  // Twilio compliance: the way out travels with the first message somebody gets
  // from a number they do not recognise.
  if (template.isFirstContact) body += STOP_SUFFIX[locale];

  assertSafe(body);
  return body;
}
