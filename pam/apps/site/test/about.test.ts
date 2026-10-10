import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ABOUT,
  ABOUT_LANGS,
  ABOUT_ON_HOME,
  SIGNED_OFF,
  aboutPath,
  builtLangs,
  isSignedOff,
} from '../src/content/about';

const SEVEN = ['en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'];

describe('About Pam, in seven languages', () => {
  it('has exactly the app’s seven languages, English first', () => {
    expect(ABOUT_LANGS).toEqual(SEVEN);
    for (const lang of SEVEN) expect(ABOUT[lang as keyof typeof ABOUT].lang).toBe(lang);
  });

  it('is right to left in Arabic and nowhere else', () => {
    for (const lang of ABOUT_LANGS) expect(ABOUT[lang].dir).toBe(lang === 'ar' ? 'rtl' : 'ltr');
  });

  it('has every field filled in every language, with the same number of "today" items', () => {
    for (const lang of ABOUT_LANGS) {
      const t = ABOUT[lang];
      for (const [key, value] of Object.entries(t)) {
        if (key === 'today') continue;
        expect(String(value).trim(), `${lang}.${key}`).not.toBe('');
      }
      expect(t.today, lang).toHaveLength(ABOUT.en.today.length);
      for (const item of t.today) expect(item.title && item.body, lang).toBeTruthy();
    }
  });

  it('writes the name Pam in Latin letters in every language', () => {
    for (const lang of ABOUT_LANGS) expect(ABOUT[lang].lead, lang).toContain('Pam');
  });

  it('describes the picture in every language, and says it has no words', () => {
    const alts = ABOUT_LANGS.map((l) => ABOUT[l].artAlt);
    expect(new Set(alts).size).toBe(7);
  });

  it('says reminder texts are coming, not here, in every language', () => {
    // The one thing the post must not promise as live (TextsFromPam.tsx: VISIT_REMINDERS_LIVE).
    expect(ABOUT.en.coming).toMatch(/does not send them yet/);
    const post = readFileSync(join(__dirname, '..', 'src', 'content', 'TextsFromPam.tsx'), 'utf8');
    expect(post).toMatch(/VISIT_REMINDERS_LIVE = false/);
  });

  it('never uses the words Pam never displays', () => {
    const all = JSON.stringify(ABOUT).toLowerCase();
    for (const word of ['prisoner', 'ex-offender', 'inmate', 'convict', 'justice']) expect(all).not.toContain(word);
  });

  it('puts each page at /<lang>/about-pam/', () => {
    expect(aboutPath('pt-BR')).toBe('/pt-BR/about-pam/');
    expect(aboutPath('ar')).toBe('/ar/about-pam/');
  });

  it('publishes nothing until a language is signed, and the home section follows English', () => {
    const file = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'content', 'signed-off.json'), 'utf8'));
    expect(SIGNED_OFF).toEqual(file['about-pam']);
    expect(builtLangs()).toEqual(ABOUT_LANGS.filter(isSignedOff));
    expect(ABOUT_ON_HOME).toBe(isSignedOff('en'));
    // Today: Will has not signed the English, so nothing is live.
    expect(SIGNED_OFF).toEqual([]);
    expect(ABOUT_ON_HOME).toBe(false);
  });
});
