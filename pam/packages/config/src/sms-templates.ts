/**
 * SMS templates — SOP §9.
 *
 * Assume every phone is shared or visible to someone else. A message that
 * reveals justice involvement can cost a member their housing or their job.
 * These rules are enforced here, in code, not left to the caller:
 *
 *  - never name justice terms, programs that imply justice involvement,
 *    other users' full names, or health/legal detail
 *  - "PAM:" prefix, one clear action, <= 160 characters, no emoji
 *  - STOP instruction on the first message to a number, and monthly after
 *  - every template carries `reviewedBy`; an unreviewed template cannot send
 */

export type SmsTemplateKey =
  | 'invite_member'
  | 'invite_provider'
  | 'verify_code'
  | 'facilitation_member'
  | 'facilitation_provider'
  | 'appointment_24h'
  | 'appointment_2h'
  | 'appointment_morning_of'
  | 'attendance_check'
  | 'attendance_missed_followup'
  | 'connection_request'
  | 'access_limited_notice'
  | 'saved_place_closed';

export interface SmsTemplate {
  readonly key: SmsTemplateKey;
  /**
   * Template body. `{placeholders}` are filled by `renderSms`.
   * Written in plain language at a 5th-grade reading level.
   */
  readonly en: string;
  readonly es: string;
  /** Named placeholders this template expects. Render fails if any is missing. */
  readonly vars: readonly string[];
  /**
   * Who signed off on the copy against §9. An empty string means NOT reviewed,
   * and `renderSms` will refuse to render it. Do not fill this in for your own
   * draft — it is a human sign-off field.
   */
  readonly reviewedBy: string;
  /** True when this is the first message PAM sends a number — forces STOP text. */
  readonly isFirstContact: boolean;
  /**
   * Per-variable length budget. A value longer than its budget is shortened at
   * a word boundary rather than pushing the body over 160 characters.
   *
   * This exists because a reminder that throws is a reminder that never sends.
   * A member missing their appointment because their street address was long is
   * a far worse outcome than a slightly clipped address next to a maps link.
   */
  readonly maxVarLengths?: Readonly<Record<string, number>>;
}

/**
 * Words that must never appear in an outbound SMS. Checked case-insensitively
 * against the rendered body. This is a backstop against a careless edit, not a
 * substitute for review.
 */
export const FORBIDDEN_SMS_TERMS: readonly string[] = [
  'parole',
  'probation',
  'officer',
  'case manager',
  'inmate',
  'prisoner',
  'offender',
  'ex-offender',
  'convict',
  'conviction',
  'felon',
  'felony',
  'incarcerat',
  'reentry',
  're-entry',
  'halfway house',
  'correctional',
  'corrections',
  'jail',
  'prison',
  'release',
  'supervision',
  'court',
  'sentence',
];

export const SMS_MAX_LENGTH = 160;

/**
 * Why a place came out of the catalogue, in the words a member reads.
 *
 * These live here rather than in the locale bundles because they end up inside
 * a text message, which means they are subject to every §9 rule and belong in
 * the same review pass as the templates themselves. The dispatcher looks up the
 * phrase by key in the member's own language; the queue carries the key, never
 * the phrase, so a correction here reaches messages that are already waiting.
 *
 * Spanish uses verb phrases rather than adjectives on purpose: "cerrado" has to
 * agree with the gender of a noun the database does not know.
 */
export const SERVICE_FLAG_REASONS = {
  closed: {
    en: 'closed, so there is no need to go',
    es: 'ya no abre, no hace falta ir',
  },
  moved: {
    en: 'at a new address now',
    es: 'cambio de direccion',
  },
  not_accepting: {
    en: 'not taking new people, so there is no need to go',
    es: 'no acepta gente nueva, no hace falta ir',
  },
  wrong_info: {
    en: 'listed wrong here',
    es: 'esta mal anotado aqui',
  },
} as const;

export type ServiceFlagReason = keyof typeof SERVICE_FLAG_REASONS;

export const SERVICE_FLAG_REASON_KEYS = Object.keys(
  SERVICE_FLAG_REASONS,
) as ServiceFlagReason[];

const STOP_SUFFIX_EN = ' Reply STOP to stop texts.';
const STOP_SUFFIX_ES = ' Responda STOP para no recibir mensajes.';

/**
 * Who read this copy and signed it off.
 *
 * Every template shipped with this empty, and `renderSms` threw on an
 * unreviewed one, so PAM could not text anybody until a person had read the
 * words. Will read all thirteen and approved them on 13 September 2026, and
 * this is that record.
 *
 * It is not decoration. Emptying it stops every message again, which is the
 * correct behaviour for copy nobody has read — so **a new template starts empty
 * and stays empty until a human says otherwise**, and rewording an existing one
 * means asking again. An agent must never fill this in on its own authority.
 */
const REVIEWED_BY = 'Will (Oba), 13 September 2026';

/** The catalogue. */
export const SMS_TEMPLATES: Readonly<Record<SmsTemplateKey, SmsTemplate>> = {
  invite_member: {
    key: 'invite_member',
    en: "PAM: You've been invited to PAM, an app for finding help and people near you. Tap to join: {link}",
    es: 'PAM: Le invitaron a PAM, una app para encontrar ayuda y personas cerca. Toque para entrar: {link}',
    vars: ['link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: true,
  },
  invite_provider: {
    key: 'invite_provider',
    en: 'PAM: You have been invited to list your services on PAM. Tap to set up your page: {link}',
    es: 'PAM: Le invitaron a publicar sus servicios en PAM. Toque para crear su pagina: {link}',
    vars: ['link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: true,
  },
  verify_code: {
    key: 'verify_code',
    en: 'PAM: Your code is {code}. It works for 10 minutes.',
    es: 'PAM: Su codigo es {code}. Sirve por 10 minutos.',
    vars: ['code'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  /**
   * §9: admin-originated SMS never says parole/probation/officer/case manager.
   * The admin's FIRST NAME only — never a title, never a full name.
   *
   * Reviewed with Will (D-062): the name stays. A text from a stranger about a
   * programme reads like spam, and a member who cannot tell whether to trust it
   * does not tap. Whatever fills `adminFirstName` must pass a first name and
   * nothing else — a surname or a title here would defeat the whole rule.
   */
  facilitation_member: {
    key: 'facilitation_member',
    en: 'PAM: {adminFirstName} connected you with a program that can help. Open PAM to say hi: {link}',
    es: 'PAM: {adminFirstName} le conecto con un programa que puede ayudar. Abra PAM para saludar: {link}',
    vars: ['adminFirstName', 'link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  facilitation_provider: {
    key: 'facilitation_provider',
    en: 'PAM: Someone was introduced to your program. Open PAM to reply: {link}',
    es: 'PAM: Alguien fue presentado a su programa. Abra PAM para responder: {link}',
    vars: ['link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  /**
   * The Spanish copy is written without accents so it stays inside GSM-7, the
   * cheap SMS encoding: one accented character outside that set switches the
   * whole message to UCS-2 and halves the limit from 160 to 70, splitting one
   * message into two.
   *
   * `ñ` is the exception — it IS in the GSM-7 basic set, so it costs nothing,
   * and "manana" without it is not a word. Reviewed with Will: keep the English
   * YES/NO the reply parser listens for, keep the rest accent-free, take the
   * free fix.
   */
  appointment_24h: {
    key: 'appointment_24h',
    en: 'PAM: You have a visit tomorrow at {time}. {address}. Tap for directions: {link}',
    es: 'PAM: Tiene una visita mañana a las {time}. {address}. Toque para llegar: {link}',
    vars: ['time', 'address', 'link'],
    maxVarLengths: { address: 34 },
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  appointment_2h: {
    key: 'appointment_2h',
    en: 'PAM: Your visit is at {time} today. {address}. Tap for directions: {link}',
    es: 'PAM: Su visita es hoy a las {time}. {address}. Toque para llegar: {link}',
    vars: ['time', 'address', 'link'],
    maxVarLengths: { address: 34 },
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  appointment_morning_of: {
    key: 'appointment_morning_of',
    en: 'PAM: Today at {time} you have a visit. {address}. Tap for directions: {link}',
    es: 'PAM: Hoy a las {time} tiene una visita. {address}. Toque para llegar: {link}',
    vars: ['time', 'address', 'link'],
    maxVarLengths: { address: 34 },
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  attendance_check: {
    key: 'attendance_check',
    en: 'PAM: Did you make it today? Reply YES or NO.',
    es: 'PAM: Pudo ir hoy? Responda YES o NO.',
    vars: [],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  /** §7.2: a missed visit is never penalised. Gentle, one action, no guilt. */
  attendance_missed_followup: {
    key: 'attendance_missed_followup',
    en: 'PAM: No problem. We saved a step to set up a new time. Open PAM when you are ready: {link}',
    es: 'PAM: No hay problema. Guardamos un paso para buscar otra fecha. Abra PAM cuando pueda: {link}',
    vars: ['link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  /** §6.2: no names in a connection-request SMS. */
  connection_request: {
    key: 'connection_request',
    en: 'PAM: Someone on PAM wants to connect. Open PAM to reply: {link}',
    es: 'PAM: Alguien en PAM quiere conectar. Abra PAM para responder: {link}',
    vars: ['link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  /**
   * A place somebody saved has been taken out of the catalogue.
   *
   * **It never names the place**, and that is Will's call rather than a
   * limitation. Naming it would add nothing a member needs — they saved it, and
   * the app will show them which one — while turning every message into a
   * disclosure problem: "Fairmount Behavioral Health is closed" on a lock
   * screen tells a roommate something the member never chose to tell them.
   * There was a second, nameless template for exactly those places; not naming
   * any of them deleted the branch and the risk with it.
   *
   * The wording says what is wrong and offers a way on. It never says the place
   * was "not useful": a flag means somebody reported it as gone, which is not a
   * review, and a verdict on an organisation does not belong in a member's
   * messages.
   *
   * Both bodies are short enough to carry the STOP line and stay under 160 even
   * with the longest reason — including the mismatched case the length test
   * measures, where an English reason lands in the Spanish body. That cannot
   * happen in practice, but a template with no headroom is one edit from
   * splitting every notice into two messages.
   */
  saved_place_closed: {
    key: 'saved_place_closed',
    en: 'PAM: A place you saved is {reason}. Find others in PAM: {link}',
    es: 'PAM: Un lugar que guardo {reason}. Vea otros en PAM: {link}',
    vars: ['reason', 'link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  access_limited_notice: {
    key: 'access_limited_notice',
    en: 'PAM: Some parts of PAM are turned off for now. Call {supportPhone} with questions.',
    es: 'PAM: Algunas partes de PAM estan apagadas por ahora. Llame al {supportPhone} si tiene preguntas.',
    vars: ['supportPhone'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
};

export class UnreviewedTemplateError extends Error {
  constructor(key: SmsTemplateKey) {
    super(
      `SMS template "${key}" has no reviewedBy and cannot be sent. ` +
        'A human must review the copy against SOP §9 and record their name.',
    );
    this.name = 'UnreviewedTemplateError';
  }
}

export class SmsContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmsContentError';
  }
}

export interface RenderSmsOptions {
  readonly key: SmsTemplateKey;
  readonly locale: 'en' | 'es';
  readonly vars?: Readonly<Record<string, string>>;
  /** Force the STOP suffix — true for first contact and the monthly reminder. */
  readonly includeStop?: boolean;
  /**
   * Escape hatch for tests only. Skips the reviewedBy gate. Never set this in
   * application code; the dispatcher does not pass it.
   */
  readonly allowUnreviewed?: boolean;
}

/**
 * Renders a template to a sendable body, or throws.
 *
 * Throwing is the point: a reminder that fails loudly in the dispatcher is
 * recoverable, a text that outs someone to their roommate is not.
 */
export function renderSms(options: RenderSmsOptions): string {
  const { key, locale, vars = {}, includeStop, allowUnreviewed = false } = options;
  const template = SMS_TEMPLATES[key];

  if (!template.reviewedBy && !allowUnreviewed) {
    throw new UnreviewedTemplateError(key);
  }

  let body = locale === 'es' ? template.es : template.en;

  for (const name of template.vars) {
    const value = vars[name];
    if (value === undefined || value === '') {
      throw new SmsContentError(`Template "${key}" is missing required variable "${name}".`);
    }
    const budget = template.maxVarLengths?.[name];
    const fitted = budget === undefined ? value : shortenToFit(value, budget);
    body = body.split(`{${name}}`).join(fitted);
  }

  const leftover = body.match(/\{[a-zA-Z0-9_]+\}/);
  if (leftover) {
    throw new SmsContentError(`Template "${key}" left an unfilled placeholder: ${leftover[0]}`);
  }

  if (includeStop ?? template.isFirstContact) {
    body += locale === 'es' ? STOP_SUFFIX_ES : STOP_SUFFIX_EN;
  }

  assertSmsIsSafe(body, key);
  return body;
}

/**
 * Shortens a value to `max` characters, preferring a word boundary.
 *
 * No ellipsis: the three characters are better spent on the address itself, and
 * a trailing "..." reads as an error to someone scanning a text quickly. The
 * maps link in the same message carries the exact destination anyway.
 */
export function shortenToFit(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  // Only fall back to a hard cut when the first word alone exceeds the budget.
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/** Emoji, pictographs and dingbats — §9 forbids all of them in SMS. */
/**
 * The characters GSM-7 can carry — the cheap SMS encoding.
 *
 * One character outside this set switches the whole message to UCS-2, which
 * halves the limit from 160 to 70 and splits one message into two. That is a
 * doubled bill on every reminder, and on a pilot budget it is the difference
 * between reminding everybody and reminding half of them.
 *
 * This is why the Spanish copy is written without accents. It is also why `ñ`
 * is allowed to stay: it is in this set, so "mañana" is spelled correctly at no
 * cost. Anything added to the Spanish copy has to pass this check.
 */
const GSM7_CHARS = new Set(
  (
    '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
    '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà' +
    // The extension table. These cost two characters each rather than one, so
    // they are legal but not free.
    '^{}\\[~]|€'
  ).split(''),
);

/** Every character in `text` fits the cheap encoding. */
export function isGsm7(text: string): boolean {
  return [...text].every((c) => GSM7_CHARS.has(c));
}

/** The characters in `text` that would force the expensive encoding. */
export function nonGsm7Characters(text: string): string[] {
  return [...new Set([...text].filter((c) => !GSM7_CHARS.has(c)))];
}

const EMOJI_PATTERN =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F2FF}]/u;

/**
 * Final gate before a body reaches Twilio. Exported so the dispatcher can
 * re-check a body it assembled from any path, not just `renderSms`.
 */
export function assertSmsIsSafe(body: string, key?: string): void {
  const where = key ? ` (template "${key}")` : '';

  if (!body.startsWith('PAM:')) {
    throw new SmsContentError(`SMS must start with the "PAM:" prefix${where}.`);
  }
  if (body.length > SMS_MAX_LENGTH) {
    throw new SmsContentError(
      `SMS is ${body.length} characters, over the ${SMS_MAX_LENGTH} limit${where}.`,
    );
  }
  if (EMOJI_PATTERN.test(body)) {
    throw new SmsContentError(`SMS must not contain emoji${where}.`);
  }

  const lowered = body.toLowerCase();
  for (const term of FORBIDDEN_SMS_TERMS) {
    if (lowered.includes(term)) {
      throw new SmsContentError(
        `SMS contains the forbidden term "${term}"${where}. ` +
          'Outbound texts must never reveal justice involvement (SOP §9).',
      );
    }
  }
}

/** True when every template has a recorded reviewer. CI asserts this before a release build. */
export function allTemplatesReviewed(): boolean {
  return Object.values(SMS_TEMPLATES).every((t) => t.reviewedBy.length > 0);
}

export function unreviewedTemplateKeys(): SmsTemplateKey[] {
  return Object.values(SMS_TEMPLATES)
    .filter((t) => !t.reviewedBy)
    .map((t) => t.key);
}
