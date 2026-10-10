import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ABOUT_LANGS } from '../src/content/about';
import { RULES, RULES_SLUG, SIGNING_LIVE, isRulesSigned, rulesBuiltLangs, rulesPath } from '../src/content/rules';
import { ALL_POSTS, POSTS, anyPostBySlug } from '../src/content/posts';

describe('Signing a program’s rules, in seven languages', () => {
  it('has the same shape in every language: 7 sections, 3 steps in "how you sign"', () => {
    for (const lang of ABOUT_LANGS) {
      const t = RULES[lang];
      expect(t.sections, lang).toHaveLength(RULES.en.sections.length);
      for (const [i, section] of t.sections.entries()) {
        expect(section.title.trim(), `${lang} ${i}`).not.toBe('');
        expect(section.paras.length, `${lang} ${i}`).toBe(RULES.en.sections[i]!.paras.length);
        expect(section.steps?.length ?? 0, `${lang} ${i}`).toBe(RULES.en.sections[i]!.steps?.length ?? 0);
        for (const p of [...section.paras, ...(section.steps ?? [])]) expect(p.trim(), lang).not.toBe('');
      }
      expect(t.title && t.summary && t.lead, lang).toBeTruthy();
    }
    expect(RULES.en.sections[1]!.steps).toHaveLength(3);
  });

  it('says in English what the brief says, and no more', () => {
    const en = JSON.stringify(RULES.en);
    expect(en).toContain('Bring ID');
    expect(en).toContain('Draw your name with your finger');
    expect(en).toContain('Type my name instead');
    expect(en).toContain('first name and the date you signed');
    expect(en).toContain('never sees the picture of your signature');
    expect(en).toContain('never changed after you sign it');
    expect(en).toContain('never stops you from booking');
    expect(en).toContain('It is not a legal signature');
    // Nothing about texts or reminders: this post promises none.
    expect(en.toLowerCase()).not.toMatch(/reminder|text you|sms/);
  });

  it('never uses the words Pam never displays', () => {
    const all = JSON.stringify(RULES).toLowerCase();
    for (const word of ['prisoner', 'ex-offender', 'inmate', 'convict', 'justice']) expect(all).not.toContain(word);
  });

  it('is live with the English signed (D-489) and the other six still drafts', () => {
    const file = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'content', 'signed-off.json'), 'utf8'));
    expect(SIGNING_LIVE).toBe(file['program-rules-live']);
    expect(SIGNING_LIVE).toBe(true);
    expect(file['program-rules']).toEqual(['en']);
    expect(isRulesSigned('en')).toBe(true);
    // Six drafts: no page is built for them outside a preview.
    expect(rulesBuiltLangs()).toEqual([]);
    expect(anyPostBySlug(RULES_SLUG)?.status).toBeUndefined();
    expect(POSTS.find((p) => p.slug === RULES_SLUG)).toBeDefined();
  });

  it('puts English at the Support post and the others at /<lang>/program-rules/', () => {
    expect(rulesPath('en')).toBe('/support/signing-a-programs-rules/');
    expect(rulesPath('ar')).toBe('/ar/program-rules/');
  });
});

describe('what promises members can sign in Pam', () => {
  it('ties the signing sentences in Planning a visit and Pam words to SIGNING_LIVE', () => {
    for (const file of ['PlanningAVisit.tsx', 'PamWords.tsx']) {
      const src = readFileSync(join(__dirname, '..', 'src', 'content', file), 'utf8');
      expect(src, file).toContain('SIGNING_LIVE');
    }
    expect(SIGNING_LIVE).toBe(true);
  });
});
