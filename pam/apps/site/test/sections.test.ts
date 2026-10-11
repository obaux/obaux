import { describe, expect, it } from 'vitest';
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
