import { pamHoursLine, parsePamHours, type PamHours } from '@pam/config';

/**
 * What a message written by no person says (D-605). The database holds a KEY (`messages.system_key`, 20261018071643) and what the
 * sentence needs; the words are drawn here, in the reader's own language, so Pam's welcome and out-of-hours reply are in all seven
 * and follow a later change of language. Sage's words (ledger fb410c60 and a2696fa8): `pam.welcome` ("Hi {name}, it's Pam. If you need help with anything, reply here."),
 * `pam.welcome.noName`, and `pam.away` ("Thanks for writing. Pam is here {hours}, and we'll read your message then.") with its last
 * line `pam.away.crisis` ("In a crisis, call or text 988."). {hours} is `pamHoursLine`, the one function the hours editor's preview uses too.
 */
export interface PamWords {
  /** Draws a key with its values (in Arabic it wraps each value in direction marks: for what is shown). */
  readonly t: (key: string, vars?: Record<string, string>) => string;
  /** The same, plain (no direction marks): for the hours line, which `t` then wraps once as a value. */
  readonly tPlain: (key: string, vars?: Record<string, string>) => string;
  readonly locale: string;
  /** The reader's first name; null when Pam has none on file. */
  readonly firstName: string | null;
  /** When Pam is here (`pam_status()`), or the default until it is known. */
  readonly hours: PamHours;
}

/** The sentence for a system message, or null for a key this build does not know (it then shows nothing rather than a key). */
export function pamSystemText(key: string, words: PamWords, vars?: Readonly<Record<string, unknown>> | null): string | null {
  switch (key) {
    case 'pam.welcome':
      return words.firstName ? words.t('pam.welcome', { name: words.firstName }) : words.t('pam.welcome.noName');
    case 'pam.away':
      // The hours in force when the reply was sent, when it carries them (20261018182004); today's for the replies sent before that.
      return `${words.t('pam.away', { hours: pamHoursLine(vars?.hours ? parsePamHours(vars.hours) : words.hours, words.locale, words.tPlain) })}\n\n${words.t('pam.away.crisis')}`;
    default:
      return null;
  }
}
