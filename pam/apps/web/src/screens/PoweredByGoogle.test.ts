import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PUBLIC = join(__dirname, '../../public');
const component = readFileSync(join(__dirname, 'PoweredByGoogle.tsx'), 'utf8');

/** Google's own files, served by Pam and never loaded from Google (D-557, Privacy p5). */
describe('Google Maps attribution files', () => {
  const files = ['google-maps-attribution-light.svg', 'google-maps-attribution-dark.svg'];

  it('are the ones the component points at, and are there', () => {
    for (const name of files) {
      expect(component).toContain(`/google/${name}`);
      expect(() => readFileSync(join(PUBLIC, 'google', name))).not.toThrow();
    }
  });

  it('are Google\'s 98 × 18 logo, with nothing in them that runs or loads', () => {
    for (const name of files) {
      const svg = readFileSync(join(PUBLIC, 'google', name), 'utf8');
      expect(svg).toMatch(/width="98px"/);
      expect(svg).toMatch(/height="18px"/);
      expect(svg).not.toMatch(/<script|<foreignObject|\bhref=|xlink:href|url\(http|@import/i);
    }
  });

  it('are light-on-dark and dark-on-light: Google\'s Gray (#5E5E5E) and White', () => {
    expect(readFileSync(join(PUBLIC, 'google', files[0]!), 'utf8')).toContain('#5E5E5E');
    expect(readFileSync(join(PUBLIC, 'google', files[1]!), 'utf8').toLowerCase()).toMatch(/#fff/);
  });

  it('are never fetched from Google', () => {
    expect(component).not.toMatch(/https?:\/\//);
  });
});
