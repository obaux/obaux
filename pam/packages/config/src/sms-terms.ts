/**
 * What an outbound text must never say, in every language Pam texts in (§9).
 *
 * "No SMS may reveal justice involvement" was enforced against English words
 * only. A Spanish text with "libertad condicional" in it passed every check,
 * because the list could not read it. Each language has its own list now, and
 * the check applies the English one too, so a word cannot hide by being left
 * untranslated.
 *
 * Like the English list, this is a backstop against a careless edit, not a
 * substitute for review: a native reader signs the wording, and these catch
 * what a hurried edit puts back afterwards.
 *
 * Matching is by substring, on text folded to lower case with accents and
 * combining marks removed, so "prisão" is caught in "prisao" (the Portuguese
 * and Spanish texts are written without accents on purpose — sms-templates.ts)
 * and so a stem catches its endings in languages that inflect.
 */
import { FORBIDDEN_UI_TERMS_AR, FORBIDDEN_UI_TERMS_PT, FORBIDDEN_UI_TERMS_RU, FORBIDDEN_UI_TERMS_ZH } from './language.js';
import type { Locale } from './i18n.js';

/** English — the list the config package has always carried. */
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

/** Spanish. The UI check had no list of its own (found 9 October 2026); a text cannot wait for one. */
const FORBIDDEN_SMS_TERMS_ES: readonly string[] = [
  'libertad condicional',
  'libertad vigilada',
  'condicional',
  'prision',
  'preso',
  'presidiari',
  'recluso',
  'reclusion',
  'carcel',
  'encarcel',
  'penitenciari',
  'convicto',
  'exconvicto',
  'condena',
  'condenad',
  'sentencia',
  'antecedentes penales',
  'delincuente',
  'delito',
  'criminal',
  'tribunal',
  'juzgado',
  'gestor de caso',
  'gestora de caso',
  'trabajador de caso',
  'oficial de libertad',
  'reinsercion',
  'supervision',
  'excarcel',
];

const FORBIDDEN_SMS_TERMS_PT: readonly string[] = [
  ...FORBIDDEN_UI_TERMS_PT,
  'condicional',
  'prisao',
  'preso',
  'detento',
  'cadeia',
  'delegacia',
  'tribunal',
  'sentenca',
  'reincid',
  'reentrada',
  'gestor de caso',
  'gestora de caso',
  'gerente de caso',
  'agente de liberdade',
  'supervisao',
];

const FORBIDDEN_SMS_TERMS_ZH: readonly string[] = [
  ...FORBIDDEN_UI_TERMS_ZH,
  '狱', // any word for prison, in either script
  '犯', // offender, criminal
  '案件经理', '案件經理', '个案经理', '個案經理', '个案管理', '個案管理', // case manager
  '法院', '法庭', '判决', '判決', '宣判', // court, sentence
  '监管', '監管', '监督', '監督', // supervision
  '释放', '釋放', // release
  '重返社会', '重返社會', '更生',
];

const FORBIDDEN_SMS_TERMS_RU: readonly string[] = [
  ...FORBIDDEN_UI_TERMS_RU,
  'суд', // court, sentence — also catches судим…, which the list above already holds
  'приговор',
  'надзор',
  'куратор', // a case manager, as the word is often used
  'кейс-менеджер',
  'менеджер по делу',
  'освобожд', // release
];

const FORBIDDEN_SMS_TERMS_AR: readonly string[] = [
  ...FORBIDDEN_UI_TERMS_AR,
  'إفراج', 'افراج', 'أفرج',
  'مراقبة سلوك', 'فترة اختبار', 'اختبار قضائي', // probation
  'محكمة', 'قاضي', 'حكم بالسجن', // court, judge, sentence
  'إعادة إدماج', 'اعادة ادماج', 'إعادة الإدماج',
  'مدير الحالة', 'مدير حالة', 'مسؤول الحالة', // case manager
  'إشراف', 'اشراف', // supervision
];

export const FORBIDDEN_SMS_TERMS_BY_LOCALE: Readonly<Record<Locale, readonly string[]>> = {
  en: FORBIDDEN_SMS_TERMS,
  es: FORBIDDEN_SMS_TERMS_ES,
  'pt-BR': FORBIDDEN_SMS_TERMS_PT,
  'zh-CN': FORBIDDEN_SMS_TERMS_ZH,
  'zh-HK': FORBIDDEN_SMS_TERMS_ZH,
  ru: FORBIDDEN_SMS_TERMS_RU,
  ar: FORBIDDEN_SMS_TERMS_AR,
};

/** Lower case, no accents, no combining marks (Arabic vowel marks included). */
export function foldForTermCheck(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .normalize('NFC');
}

/**
 * The forbidden terms found in `body`, for `locale`. The English list always
 * applies as well, so an English word left in a translated text is caught too.
 * Terms come back as written in the list, never as the body's own words.
 */
export function smsTermHits(body: string, locale: Locale): string[] {
  const text = foldForTermCheck(body);
  const lists = locale === 'en' ? [FORBIDDEN_SMS_TERMS] : [FORBIDDEN_SMS_TERMS, FORBIDDEN_SMS_TERMS_BY_LOCALE[locale]];
  const hits = new Set<string>();
  for (const list of lists) {
    for (const term of list) {
      if (text.includes(foldForTermCheck(term))) hits.add(term);
    }
  }
  return [...hits];
}

/**
 * The same lists as plain strings, already folded, for the dispatcher — which
 * cannot import this package and so carries them in its generated bundle.
 */
export function foldedSmsTermsByLocale(): Record<string, string[]> {
  return Object.fromEntries(
    (Object.keys(FORBIDDEN_SMS_TERMS_BY_LOCALE) as Locale[]).map((locale) => [
      locale,
      [...new Set(FORBIDDEN_SMS_TERMS_BY_LOCALE[locale].map(foldForTermCheck))],
    ]),
  );
}
