import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUNDLES, EN } from './_bundles.js';
import { LEGAL_DOCUMENTS, legalKeys } from '../src/legal.js';
import { SUPPORTED_LOCALES } from '../src/i18n.js';
import { MESSAGE_TRANSLATION } from '../src/translation.js';
import { LEGAL_DOC_IDS, formatUpdated, isDocumentKey, paragraphsHash, type LegalUpdatedFile } from '../src/legal-updated.js';

/**
 * The "Last updated" date on Privacy and Terms moves when their words do (Iris's b25 re-test, W2; Mira, 13 October 2026).
 *
 * The page said "Last updated 10 October 2026" after Privacy had changed on 11, 12 and 13 October, and the Terms said 9 October
 * after their last change on 11 October. `src/legal-updated.json` holds, for each document, the day it went live and a fingerprint
 * of its English words (title, introduction, section titles, paragraphs). This fails when the words change and the fingerprint
 * does not, and when the date shown in any language is not the recorded date. The fix is one command:
 *
 *   pnpm --filter @pam/config legal:date <privacy|terms|all> <YYYY-MM-DD>     (the day the paragraph goes live, in UTC)
 *
 * The date is a fact, not a promise (Mira): it needs no signature of its own beyond Sage's on the sentence. It follows the English;
 * correcting a translation without changing the meaning does not move it.
 */
const ON = MESSAGE_TRANSLATION.enabled;
const RECORD = JSON.parse(readFileSync(fileURLToPath(new URL('../src/legal-updated.json', import.meta.url)), 'utf8')) as LegalUpdatedFile;

describe('the "Last updated" date follows the words (W2)', () => {
  it('knows which keys are the document: exactly the ones legal.ts lists, bar the date itself', () => {
    for (const doc of LEGAL_DOCUMENTS) {
      const expected = legalKeys(doc).filter((k) => k !== doc.updatedKey).sort();
      const actual = Object.keys(EN).filter((k) => isDocumentKey(doc.id, k, ON)).sort();
      expect(actual, `legal-updated.ts's rule for ${doc.id} has drifted from legalKeys()`).toEqual(expected);
    }
  });

  for (const doc of LEGAL_DOC_IDS) {
    it(`${doc}: the recorded fingerprint is the one of today's English words, or the date has not moved`, () => {
      expect(
        paragraphsHash(doc, EN, ON),
        `The words of ${doc} changed and its "Last updated" date did not. Run: pnpm --filter @pam/config legal:date ${doc} <the day the change goes live, YYYY-MM-DD> (then copy:ack; Sage signs the line).`,
      ).toBe(RECORD[doc].paragraphs);
    });

    for (const locale of SUPPORTED_LOCALES) {
      it(`${doc}: ${locale} says the recorded date`, () => {
        expect(BUNDLES[locale][`${doc}.updated`], `${locale}.json ${doc}.updated is not ${RECORD[doc].date}: run legal:date, do not edit the line by hand`).toBe(
          formatUpdated(locale, RECORD[doc].date),
        );
      });
    }

    it(`${doc}: the recorded date is a real day`, () => {
      expect(() => formatUpdated('en', RECORD[doc].date)).not.toThrow();
    });
  }

  it('is not blind: a changed word, a new paragraph or a removed one changes the fingerprint; the order of keys does not', () => {
    const before = paragraphsHash('privacy', EN, ON);
    const key = 'privacy.s.sharing.p5';
    expect(EN[key]).toMatch(/Google/);
    expect(paragraphsHash('privacy', { ...EN, [key]: `${EN[key]} ` }, ON)).not.toBe(before);
    expect(paragraphsHash('privacy', { ...EN, [key]: EN[key]!.replace('Google', 'Gogle') }, ON)).not.toBe(before);
    expect(paragraphsHash('privacy', { ...EN, 'privacy.s.sharing.p99': 'A new paragraph.' }, ON)).not.toBe(before);
    const { [key]: _gone, ...without } = EN;
    expect(paragraphsHash('privacy', without, ON)).not.toBe(before);
    expect(paragraphsHash('privacy', Object.fromEntries(Object.entries(EN).reverse()), ON)).toBe(before);
    // Privacy's fingerprint does not see the Terms, nor the page's buttons, nor the date line.
    expect(paragraphsHash('privacy', { ...EN, 'terms.s.limits.p1': 'x', 'privacy.controls.copy': 'x', 'privacy.updated': 'x' }, ON)).toBe(before);
  });

  it('counts the section about translating messages only while the page shows it (D-423), so turning it on moves the date', () => {
    const edited = { ...EN, 'privacy.s.translation.p2': `${EN['privacy.s.translation.p2']} changed` };
    expect(paragraphsHash('privacy', edited, false)).toBe(paragraphsHash('privacy', EN, false));
    expect(paragraphsHash('privacy', edited, true)).not.toBe(paragraphsHash('privacy', EN, true));
    expect(paragraphsHash('privacy', EN, true)).not.toBe(paragraphsHash('privacy', EN, false));
    expect(paragraphsHash('terms', EN, true)).toBe(paragraphsHash('terms', EN, false));
  });

  it('writes the date the way the page has always written it, in every language', () => {
    expect(formatUpdated('en', '2026-10-13')).toBe('Last updated 13 October 2026.');
    expect(formatUpdated('es', '2026-10-09')).toBe('Actualizado el 9 de octubre de 2026.');
    expect(formatUpdated('pt-BR', '2026-03-01')).toBe('Última atualização em 1 de março de 2026.');
    expect(formatUpdated('zh-CN', '2026-10-11')).toBe('最后更新于2026年10月11日。');
    expect(formatUpdated('zh-HK', '2026-10-11')).toBe('最後更新：2026年10月11日。');
    expect(formatUpdated('ru', '2026-12-31')).toBe('Обновлено 31 декабря 2026 г.');
    expect(formatUpdated('ar', '2026-10-13')).toBe('آخر تحديث: 13 أكتوبر 2026.');
    expect(() => formatUpdated('en', '2026-02-30')).toThrow();
    expect(() => formatUpdated('en', '13 October 2026')).toThrow();
  });
});
