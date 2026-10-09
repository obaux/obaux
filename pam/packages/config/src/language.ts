/**
 * Dignity and plain-language rules — SOP §0.
 *
 * "Never display 'prisoner', 'ex-offender', 'inmate', or conviction details
 *  anywhere in UI, notifications, or data exports. Use 'member' and
 *  'returning citizen' only in internal docs."
 *
 * A person reading Pam over a member's shoulder — a landlord, an employer, a
 * child — must not learn anything about where they have been. That is why this
 * is a test that fails the build and not a style note.
 *
 * `assertCopyIsDignified` runs over every locale string in CI. It also runs over
 * CSV exports before they are written (§13 Phase 5).
 */

/**
 * Forbidden in anything a member or provider can see: UI strings, notification
 * bodies, CSV exports, AI output.
 */
export const FORBIDDEN_UI_TERMS: readonly string[] = [
  'prisoner',
  'inmate',
  'offender',
  'ex-offender',
  'ex offender',
  'convict',
  'conviction',
  'felon',
  'felony',
  'incarcerated',
  'incarceration',
  'parolee',
  'probationer',
  'criminal record',
  'rap sheet',
  'justice-involved',
  'justice involved',
  'formerly incarcerated',
];

/**
 * The same rule in every other language Pam speaks (added with the languages,
 * D-413). Matching is by substring — `includes` on the lower-cased text — so
 * each entry is a stem chosen not to sit inside an ordinary word. That is why
 * Portuguese has no bare "preso" (inside "surpreso", surprised), "detento"
 * (inside "detentor", holder), "recluso" or "cadeia" (a chain), and why Arabic
 * has "نزلاء" but not "نزيل" (inside "تنزيل", download). If a word the copy
 * needs trips one of these, reword the copy: the stems are the ones that
 * would out somebody.
 *
 * Every list is applied to every bundle (`ALL_FORBIDDEN_TERMS`), so a term
 * from one language can never hide in another's file.
 *
 * Spanish has no list of its own yet (found 9 October 2026); until it does,
 * `es.json` is only checked against the English terms above and the others
 * here.
 */
export const FORBIDDEN_UI_TERMS_PT: readonly string[] = [
  'presidiári', // presidiário/a — inmate
  'ex-preso',
  'ex-detent',
  'ex-condenad',
  'ex-apenad',
  'ex-interno',
  'encarcera', // encarcerado/a, encarceramento
  'condenad', // condenado/a — convicted
  'condenaç', // condenação — a conviction
  'sentenciad',
  'apenad', // apenado/a — the legal word for someone serving a sentence
  'criminos', // criminoso/a/s
  'delinquen',
  'antecedentes criminais',
  'ficha criminal',
  'folha corrida',
  'prisional', // sistema prisional
  'penitenciári',
  'prisão',
  'reclusão',
  'egresso', // egresso do sistema prisional
  'liberdade condicional',
  'livramento condicional',
  'liberdade vigiada',
  'tornozeleira', // ankle monitor
  'regime semiaberto',
  'regime aberto',
];

/** Chinese, both scripts (Simplified for zh-CN, Traditional for zh-HK). */
export const FORBIDDEN_UI_TERMS_ZH: readonly string[] = [
  '囚犯', '犯人', '罪犯', '前科', '定罪', '有罪', '重罪', '在押', '刑期', '前囚', '更生人', // prisoner, offender, record, convicted
  '犯罪记录', '犯罪記錄', '犯罪紀錄', // criminal record
  '刑满', '刑滿', '刑释', '刑釋', '受刑人', // released after sentence
  '释放人员', '釋放人員',
  '出狱', '出獄', '入狱', '入獄', '服刑', '坐牢', // jail, prison, serving a sentence
  '监狱', '監獄',
  '劳改', '勞改',
  '假释', '假釋', '缓刑', '緩刑', // parole, probation
];

export const FORBIDDEN_UI_TERMS_RU: readonly string[] = [
  'заключённ', 'заключенн', // заключённый — prisoner
  'зэк',
  'осуждённ', 'осужденн', 'осуждени', // convicted, conviction
  'судимост', // a record
  'тюрь', // prison
  'колони', // penal colony
  'исправительн',
  'освободивш', // освободившийся — someone released
  'отбыв', // served a sentence
  'условно-досрочн', // parole
  'испытательный срок', // probation
  'пробаци',
  'уголовн', // criminal
  'преступ', // crime, offender
  'правонарушител',
  'рецидив',
  'арестант',
  'лишени', // лишение свободы — deprivation of liberty
  'изолятор',
  'сизо',
];

export const FORBIDDEN_UI_TERMS_AR: readonly string[] = [
  'سجين', 'سجناء', 'مسجون', 'نزلاء', 'معتقل', // prisoner, inmates, detainee
  'سجن', // prison / jail
  'مجرم', 'جريمة', 'جرائم', 'جنائي', // criminal, crime
  'سوابق', // a record
  'محكوم', 'مدان', 'إدانة', // sentenced, convicted
  'الإفراج المشروط', 'ضابط مراقبة', // parole, probation officer
  'عقوبة',
];

/**
 * Jargon §0 bans by name, mapped to what to say instead. Not build-blocking —
 * a word like "plan" is fine in some sentences — but `findJargon` surfaces it
 * in review so copy drifts toward plain language rather than away from it.
 */
export const JARGON_REPLACEMENTS: Readonly<Record<string, string>> = {
  onboarding: 'setting up',
  dashboard: 'home',
  sync: 'save',
  syncing: 'saving',
  authenticate: 'sign in',
  authentication: 'signing in',
  credentials: 'your phone number',
  submit: 'send',
  enroll: 'sign up',
  eligibility: 'who can join',
  utilize: 'use',
  navigate: 'go',
  resource: 'place',
  provider: 'program',
};

const ALL_FORBIDDEN_TERMS: readonly string[] = [
  ...FORBIDDEN_UI_TERMS,
  ...FORBIDDEN_UI_TERMS_PT,
  ...FORBIDDEN_UI_TERMS_ZH,
  ...FORBIDDEN_UI_TERMS_RU,
  ...FORBIDDEN_UI_TERMS_AR,
];

export class DignityViolationError extends Error {
  constructor(
    readonly term: string,
    readonly where: string,
  ) {
    super(
      `Copy at "${where}" contains the forbidden term "${term}". ` +
        'Pam never shows justice involvement to a user (SOP §0).',
    );
    this.name = 'DignityViolationError';
  }
}

/**
 * Throws on the first forbidden term. `where` is a locale key or export column
 * so the failure names the exact string to fix.
 */
export function assertCopyIsDignified(text: string, where: string): void {
  const lowered = text.toLowerCase();
  for (const term of ALL_FORBIDDEN_TERMS) {
    if (lowered.includes(term)) {
      throw new DignityViolationError(term, where);
    }
  }
}

export interface CopyIssue {
  readonly where: string;
  readonly term: string;
  readonly suggestion?: string;
}

/** Non-throwing sweep over a whole locale bundle. Used by the CI reporter. */
export function findDignityViolations(
  strings: Readonly<Record<string, string>>,
): readonly CopyIssue[] {
  const issues: CopyIssue[] = [];
  for (const [key, value] of Object.entries(strings)) {
    const lowered = value.toLowerCase();
    for (const term of ALL_FORBIDDEN_TERMS) {
      if (lowered.includes(term)) issues.push({ where: key, term });
    }
  }
  return issues;
}

export function findJargon(
  strings: Readonly<Record<string, string>>,
): readonly CopyIssue[] {
  const issues: CopyIssue[] = [];
  for (const [key, value] of Object.entries(strings)) {
    const lowered = value.toLowerCase();
    for (const [term, suggestion] of Object.entries(JARGON_REPLACEMENTS)) {
      if (new RegExp(`\\b${term}\\b`).test(lowered)) {
        issues.push({ where: key, term, suggestion });
      }
    }
  }
  return issues;
}

/**
 * Flesch-Kincaid grade level. §14 sets the target at <= 5.
 *
 * This is a heuristic — it counts vowel groups as syllables, so it is rough on
 * names and abbreviations. Treat a score over target as "a human should read
 * this", not as a hard gate; §14 asks for a readability check, not a blocker.
 */
export function fleschKincaidGrade(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
  if (words.length === 0) return 0;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;
  const groups = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
}

export const READABILITY_TARGET_GRADE = 5;
