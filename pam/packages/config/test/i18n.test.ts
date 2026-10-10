import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  directionOf,
  fillTemplate,
  intlLocale,
  isSupportedLocale,
  matchLocale,
  pickTemplate,
  LANGUAGE_TAGS,
  LANGUAGE_TAG_WIDEST,
  SWITCHING_LANGUAGE,
  type Locale,
  speechLanguageFor,
} from '../src/i18n.js';
import { findDignityViolations } from '../src/language.js';
import { BUNDLES, EN } from './_bundles.js';

describe('the language list', () => {
  it('is English first, and English is the default', () => {
    expect(SUPPORTED_LOCALES[0]).toBe('en');
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('accepts exactly the codes it lists, spelled exactly', () => {
    for (const code of SUPPORTED_LOCALES) expect(isSupportedLocale(code)).toBe(true);
    for (const bad of ['pt', 'pt-br', 'zh', 'zh-TW', 'ar-EG', 'fr', '', 'EN']) expect(isSupportedLocale(bad)).toBe(false);
  });

  it('labels every language in itself, in every bundle', () => {
    for (const code of SUPPORTED_LOCALES) {
      const labels = new Set(Object.values(BUNDLES).map((b) => b[`language.${code}`]));
      expect(labels.size, `language.${code} reads differently in different bundles`).toBe(1);
    }
  });

  it('reads right to left only in Arabic', () => {
    expect(SUPPORTED_LOCALES.filter((l) => directionOf(l) === 'rtl')).toEqual(['ar']);
  });

  it('asks a phone to listen for the right language', () => {
    expect(speechLanguageFor('en')).toBe('en-US');
    expect(speechLanguageFor('es')).toBe('es-US');
    expect(speechLanguageFor('pt-BR')).toBe('pt-BR');
    expect(speechLanguageFor('zh-CN')).toBe('zh-CN');
    expect(speechLanguageFor('zh-HK')).toBe('zh-HK');
    expect(speechLanguageFor('ar')).toBe('ar-SA');
  });
});

describe('the English tag before each language name', () => {
  it('has one for every language, and none for a language Pam does not offer', () => {
    expect(Object.keys(LANGUAGE_TAGS).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it('is the language code in capitals — Will, 10 October, decided by Mira', () => {
    for (const code of SUPPORTED_LOCALES) expect(LANGUAGE_TAGS[code]).toBe(code.toUpperCase());
  });

  it('is plain capital English letters and a hyphen, so it can never read as a word in a script', () => {
    for (const code of SUPPORTED_LOCALES) expect(LANGUAGE_TAGS[code], code).toMatch(/^[A-Z]+(-[A-Z]+)?$/);
  });

  it('tells every row apart, the two Chinese ones too', () => {
    const tags = SUPPORTED_LOCALES.map((code) => LANGUAGE_TAGS[code]);
    expect(new Set(tags).size).toBe(tags.length);
    expect(LANGUAGE_TAGS['zh-CN']).not.toBe(LANGUAGE_TAGS['zh-HK']);
  });

  it('is never a text bundle string, so no language can translate it or leave it out', () => {
    for (const [locale, bundle] of Object.entries(BUNDLES)) {
      const keys = Object.keys(bundle).filter((key) => /^language\.(tag|abbr)/i.test(key));
      expect(keys, `${locale} has a translatable language tag`).toEqual([]);
    }
    // Nor is a tag written in front of a language's own name inside the name.
    for (const code of SUPPORTED_LOCALES) {
      for (const [locale, bundle] of Object.entries(BUNDLES)) {
        const name = bundle[`language.${code}`] ?? '';
        const written = new RegExp(`^${LANGUAGE_TAGS[code]}[\\s·:|–—-]`, 'i');
        expect(name, `${locale}: language.${code} has its tag written into it`).not.toMatch(written);
      }
    }
  });

  it('knows its widest tag, which sizes the column the names line up on', () => {
    expect(LANGUAGE_TAG_WIDEST).toBe(5);
    for (const code of SUPPORTED_LOCALES) expect(LANGUAGE_TAGS[code].length).toBeLessThanOrEqual(LANGUAGE_TAG_WIDEST);
  });
});

describe('starting from the language the device is set to', () => {
  it('honours the first preference Pam can, in the person\'s own order', () => {
    expect(matchLocale(['en-US', 'es'])).toBe('en');
    expect(matchLocale(['vi-VN', 'es-MX', 'en'])).toBe('es');
    expect(matchLocale(['ar-EG'])).toBe('ar');
    expect(matchLocale(['ru-RU'])).toBe('ru');
  });

  it('knows Brazilian Portuguese reads for every Portuguese speaker', () => {
    expect(matchLocale(['pt-BR'])).toBe('pt-BR');
    expect(matchLocale(['pt-PT'])).toBe('pt-BR');
    expect(matchLocale(['pt'])).toBe('pt-BR');
  });

  it('gives Traditional characters to Hong Kong, Macau, Taiwan and Cantonese, Simplified to the rest', () => {
    for (const tag of ['zh-HK', 'zh-MO', 'zh-TW', 'zh-Hant', 'zh-Hant-HK', 'zh_HK', 'yue', 'yue-Hant-HK']) {
      expect(matchLocale([tag]), tag).toBe('zh-HK');
    }
    for (const tag of ['zh', 'zh-CN', 'zh-SG', 'zh-Hans', 'zh-Hans-CN', 'cmn-Hans-CN']) {
      expect(matchLocale([tag]), tag).toBe('zh-CN');
    }
  });

  it('says nothing when it cannot honour any preference, rather than guessing', () => {
    expect(matchLocale([])).toBeNull();
    expect(matchLocale(['vi', 'ko-KR', 'ht'])).toBeNull();
    expect(matchLocale(['', '  '])).toBeNull();
  });
});

describe('the screen between two languages', () => {
  const NAME: Record<Locale, string> = {
    en: 'English',
    es: 'español',
    'pt-BR': 'português',
    'zh-CN': '简体中文',
    'zh-HK': '繁體中文',
    ru: 'русский',
    ar: 'العربية',
  };

  it.each(SUPPORTED_LOCALES)('%s says "switching to it" in itself, and names it', (locale) => {
    const line = SWITCHING_LANGUAGE[locale];
    expect(line.toLowerCase()).toContain(NAME[locale].toLowerCase());
    expect(line.endsWith('…')).toBe(true);
  });

  it('is short enough to sit under a spinner on a phone, and says nothing it should not', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(SWITCHING_LANGUAGE[locale].length, locale).toBeLessThanOrEqual(40);
    }
    expect(findDignityViolations(SWITCHING_LANGUAGE)).toEqual([]);
  });

  it('is in its own script, because it is shown before the language has arrived', () => {
    expect(SWITCHING_LANGUAGE['zh-CN']).toMatch(/[\u4e00-\u9fff]/);
    expect(SWITCHING_LANGUAGE['zh-HK']).toMatch(/[\u4e00-\u9fff]/);
    expect(SWITCHING_LANGUAGE.ru).toMatch(/[\u0400-\u04ff]/);
    expect(SWITCHING_LANGUAGE.ar).toMatch(/[\u0600-\u06ff]/);
  });
});

describe('Intl, in every language', () => {
  it('writes Western digits everywhere, Arabic included, so a date never mixes two kinds of digit', () => {
    for (const code of SUPPORTED_LOCALES) {
      const number = new Intl.NumberFormat(intlLocale(code)).format(1234);
      const date = new Intl.DateTimeFormat(intlLocale(code), { month: 'short', day: 'numeric' }).format(
        new Date(2026, 9, 9),
      );
      expect(number, code).toMatch(/1\D?234/);
      expect(date, code).toMatch(/[09]/);
      expect(`${number}${date}`, code).not.toMatch(/[٠-٩۰-۹]/);
    }
  });

  it('passes a plain string through unchanged, for helpers handed the locale as text', () => {
    expect(intlLocale('fr')).toBe('fr');
    expect(intlLocale('pt-BR')).toBe('pt-BR');
  });
});

describe('pickTemplate and fillTemplate', () => {
  const ru = { 'a.count': '{count} штук', 'a.count.one': '{count} штука', 'a.count.few': '{count} штуки', 'only.ru': 'только' };
  const en = { 'a.count': '{count} things', 'only.en': 'only English' };
  const pick = (key: string, vars?: Record<string, string | number>) =>
    fillTemplate(pickTemplate('ru', ru, en, key, vars), vars);

  it('chooses the plural form that Russian needs, from the number', () => {
    expect(pick('a.count', { count: 1 })).toBe('1 штука');
    expect(pick('a.count', { count: 21 })).toBe('21 штука');
    expect(pick('a.count', { count: 3 })).toBe('3 штуки');
    expect(pick('a.count', { count: 5 })).toBe('5 штук'); // "many" has no variant here: the bare key
    expect(pick('a.count', { count: 1.5 })).toBe('1.5 штук'); // fractions are "other"
  });

  it('reads the number from `plural` when `count` is already formatted text', () => {
    expect(pick('a.count', { count: '2,0', plural: 2 })).toBe('2,0 штуки');
  });

  it('uses the bare key when there is no number, and English when the key is missing', () => {
    expect(pick('a.count')).toBe('{count} штук');
    expect(pick('only.en')).toBe('only English');
    expect(pick('nowhere.at.all')).toBe('nowhere.at.all');
  });

  it('leaves a placeholder with no value visible, rather than blank', () => {
    expect(fillTemplate('Hello, {name}', {})).toBe('Hello, {name}');
    expect(fillTemplate('Hello, {name}', { name: 'Ana' })).toBe('Hello, Ana');
  });

  it('never changes English: one fixed form, whatever the number', () => {
    for (const n of [0, 1, 2]) {
      expect(fillTemplate(pickTemplate('en', EN, EN, 'points.summary', { count: n }), { count: n })).toBe(`${n} points`);
    }
  });
});
