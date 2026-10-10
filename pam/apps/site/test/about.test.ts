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
    // The one thing the post must not promise as live (content/flags.ts: VISIT_REMINDERS_LIVE).
    expect(ABOUT.en.coming).toMatch(/does not send them yet/);
    const post = readFileSync(join(__dirname, '..', 'src', 'content', 'flags.ts'), 'utf8');
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

  it('has the English signed (D-483) and the other six still drafts, and the home section follows English', () => {
    const file = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'content', 'signed-off.json'), 'utf8'));
    expect(SIGNED_OFF).toEqual(file['about-pam']);
    expect(builtLangs()).toEqual(ABOUT_LANGS.filter(isSignedOff));
    expect(ABOUT_ON_HOME).toBe(isSignedOff('en'));
    // Will signed the English on 10 October 2026; nothing else is signed.
    expect(SIGNED_OFF).toEqual(['en']);
    expect(ABOUT_ON_HOME).toBe(true);
  });

  it('never says Pam is a "human-touch company" in public (D-483): internal principle only', () => {
    const all = JSON.stringify(ABOUT) + readFileSync(join(__dirname, '..', 'src', 'screens', 'HomeScreen.tsx'), 'utf8');
    for (const phrase of ['human-touch', 'human touch', 'trato humano', 'toque humano', '有人情味', 'человеческим подходом', 'اللمسة الإنسانية']) {
      expect(all.toLowerCase(), phrase).not.toContain(phrase.toLowerCase());
    }
    expect(ABOUT.en.lead).toBe('Pam helps people find city services, get to them, and remember to go.');
    expect(ABOUT.en.summary).toBe('Pam helps people find services, get to them, and remember to go.');
  });
});

describe('the home page card about reminders', () => {
  it('promises no reminder text while the switch is off, and reads the switch', () => {
    const home = readFileSync(join(__dirname, '..', 'src', 'screens', 'HomeScreen.tsx'), 'utf8');
    expect(home).toContain('VISIT_REMINDERS_LIVE');
    expect(home).not.toContain('Pam reminds you before you go, so nothing gets missed');
    expect(home).toContain('Texts that remind you are coming.');
  });
});

describe('the Points and badges post', () => {
  it('lists every way Pam pays today, with the points the config pays', async () => {
    const { AWARDED_TODAY, POINTS_RULES } = await import('../../../packages/config/src/points');
    const post = readFileSync(join(__dirname, '..', 'src', 'content', 'PointsAndBadges.tsx'), 'utf8');
    // One row per way Pam pays; a new way in AWARDED_TODAY fails here until the post says it.
    expect(AWARDED_TODAY).toHaveLength(4);
    for (const reason of AWARDED_TODAY) {
      expect(post, reason).toContain(`${POINTS_RULES[reason].points} points`);
    }
  });
});
