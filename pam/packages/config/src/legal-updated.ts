/**
 * The "Last updated" date of the Privacy page and the Terms (Iris's b25 re-test W2, Mira, 13 October 2026).
 *
 * The date on the page said 10 October after Privacy had changed three times more (the last on 13 October), and the Terms said
 * 9 October after their last change on 11 October. A date that is old is a small lie told to people who read it to decide whether
 * to trust Pam. Nothing noticed, because nothing connected the words to the date.
 *
 * What connects them is `legal-updated.json`: for each document the date it went live and a fingerprint of the English words
 * that were in it that day (its title, introduction, section titles and paragraphs: `isDocumentKey`). `legal-updated.test.ts` fails
 * when the words change and the fingerprint does not, and when the date on the page, in any of the seven languages, is not that
 * date. To move the date: `pnpm --filter @pam/config legal:date <privacy|terms|all> <YYYY-MM-DD>`.
 *
 * The date is a fact, not a promise: it is the day the newest paragraph went live (the day it was merged to `main`, in UTC), set by
 * whoever merges the change. It is worked out from the English only. A translation corrected without a change of meaning does not
 * move it. Written to run under Node's type stripping as well as under vitest (no imports of its own but `node:crypto`).
 */
import { createHash } from 'node:crypto';

export type LegalDocId = 'privacy' | 'terms';
export const LEGAL_DOC_IDS: readonly LegalDocId[] = ['privacy', 'terms'];

export interface LegalUpdated {
  /** The day the newest paragraph went live, `YYYY-MM-DD`. */
  readonly date: string;
  /** SHA-256 of the English words of the document on that day. */
  readonly paragraphs: string;
}
export type LegalUpdatedFile = Record<LegalDocId, LegalUpdated>;

/**
 * The keys that are the document itself: its title, its introduction, and every section's title and paragraphs. The controls on
 * the Privacy page ("Get a copy of my data", "Delete my account") and the date's own key are not. The section about translating
 * messages (`privacy.s.translation`) is on the page only while `MESSAGE_TRANSLATION.enabled` (D-423: the page says it exactly when it
 * is true), so it counts only then: its words are in the bundle but nobody is reading them. `legal-updated.test.ts` holds this rule
 * to `legalKeys()` in `legal.ts`, so a new section cannot be left out, and turning translation on moves the fingerprint, so the
 * date moves with it.
 */
export function isDocumentKey(doc: LegalDocId, key: string, messageTranslation: boolean): boolean {
  if (doc === 'privacy' && key.startsWith('privacy.s.translation.')) return messageTranslation;
  return key === `${doc}.title` || key === `${doc}.intro` || key.startsWith(`${doc}.s.`);
}

/** A fingerprint of the English words of a document as the page shows them: every key and its text, in key order. */
export function paragraphsHash(doc: LegalDocId, en: Readonly<Record<string, string>>, messageTranslation: boolean): string {
  const hash = createHash('sha256');
  for (const key of Object.keys(en).filter((k) => isDocumentKey(doc, k, messageTranslation)).sort()) {
    hash.update(`${key}\n${en[key]}\n\n`);
  }
  return hash.digest('hex');
}

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  'pt-BR': ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  // Russian writes the month in the genitive after the day ("10 октября").
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
} as const;

/** The sentence on the page, as each language writes it (the same wording the page has carried since 6 October). */
export function formatUpdated(locale: string, date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`not a YYYY-MM-DD date: ${date}`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const real = new Date(Date.UTC(y, mo - 1, d));
  if (real.getUTCFullYear() !== y || real.getUTCMonth() !== mo - 1 || real.getUTCDate() !== d) throw new Error(`not a real date: ${date}`);
  const month = (names: readonly string[]) => names[mo - 1]!;
  switch (locale) {
    case 'en':
      return `Last updated ${d} ${month(MONTHS.en)} ${y}.`;
    case 'es':
      return `Actualizado el ${d} de ${month(MONTHS.es)} de ${y}.`;
    case 'pt-BR':
      return `Última atualização em ${d} de ${month(MONTHS['pt-BR'])} de ${y}.`;
    case 'zh-CN':
      return `最后更新于${y}年${mo}月${d}日。`;
    case 'zh-HK':
      return `最後更新：${y}年${mo}月${d}日。`;
    case 'ru':
      return `Обновлено ${d} ${month(MONTHS.ru)} ${y} г.`;
    case 'ar':
      return `آخر تحديث: ${d} ${month(MONTHS.ar)} ${y}.`;
    default:
      throw new Error(`no "Last updated" wording for ${locale}`);
  }
}
