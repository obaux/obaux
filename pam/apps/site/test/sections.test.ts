import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SECTION_LABELS } from '../src/content/section-labels';
import { sectionLabel } from '../src/lib/section-label';
import { sectionId } from '../src/lib/slug';

describe('section ids (the "On this page" menu links to them)', () => {
  it('makes a heading into an address a person can share', () => {
    expect(sectionId('The code didn’t come')).toBe('the-code-didnt-come');
    expect(sectionId('It says “You’re offline”')).toBe('it-says-youre-offline');
    expect(sectionId('Español, Português & more')).toBe('espanol-portugues-more');
    expect(sectionId('  What a program sees  ')).toBe('what-a-program-sees');
  });

  it('gives different headings different ids', () => {
    expect(sectionId('Call us')).not.toBe(sectionId('Call us now'));
  });
});

describe('the menu label of each section', () => {
  it('uses the section’s own, then Sage’s label for that post, then the full title', () => {
    expect(sectionLabel('your-language', 'Pick it when you join')).toBe(SECTION_LABELS['your-language']!['Pick it when you join']);
    expect(sectionLabel('cant-sign-in', 'Who can join, and how')).toBe('Who can join, and how');
    expect(sectionLabel('your-language', 'Pick it when you join', 'Mine')).toBe('Mine');
    expect(sectionLabel(undefined, 'A title')).toBe('A title');
  });

  it('names, in section-labels.ts, only headings the post really has', () => {
    const FILES: Record<string, string> = Object.fromEntries(
      readdirSync(join(__dirname, '../src/content'))
        .filter((f) => f.endsWith('.tsx'))
        .map((f) => [f, readFileSync(join(__dirname, '../src/content', f), 'utf8')]),
    );
    const all = Object.values(FILES).join('\n');
    for (const [slug, labels] of Object.entries(SECTION_LABELS))
      for (const title of Object.keys(labels)) expect(all.includes(title), `${slug} › ${title}`).toBe(true);
  });
});
