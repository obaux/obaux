import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { websiteColors as c } from '../src/lib/website-palette';

// D-528: website-only tokens mirror the Figma "Website" collection. AA = 4.5:1
// for text, 3:1 for icons and strokes.

type Mode = 'light' | 'dark';
const parse = (v: string): [number, number, number, number] => {
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const m = v.match(/[\d.]+/g)!.map(Number);
  return [m[0]!, m[1]!, m[2]!, m[3] ?? 1];
};
const over = (top: number[], bottom: number[]) =>
  [0, 1, 2].map((i) => top[i]! * top[3]! + bottom[i]! * (1 - top[3]!));
const lum = (rgb: number[]) => {
  const [r = 0, g = 0, b = 0] = rgb.map((x) => {
    const s = x / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (fg: keyof typeof c, bg: keyof typeof c, mode: Mode) => {
  const page = parse(c['surface-page'][mode]);
  const back = over(parse(c[bg][mode]), page.slice(0, 3));
  const front = over(parse(c[fg][mode]), back);
  const hi = Math.max(lum(front), lum(back));
  const lo = Math.min(lum(front), lum(back));
  return (hi + 0.05) / (lo + 0.05);
};

const surfaces = ['surface-page', 'surface-muted', 'surface-gray', 'surface-green', 'surface-purple', 'surface-brand-soft'] as const;

describe('website colours: AA in both themes', () => {
  for (const mode of ['light', 'dark'] as Mode[]) {
    it(`${mode}: primary and secondary text on every surface`, () => {
      for (const s of surfaces)
        for (const t of ['text-primary', 'text-secondary'] as const)
          expect(ratio(t, s, mode), `${t} on ${s}`).toBeGreaterThanOrEqual(4.5);
    });
    it(`${mode}: muted text on page and muted`, () => {
      for (const s of ['surface-page', 'surface-muted'] as const)
        expect(ratio('text-muted', s, mode), `text-muted on ${s}`).toBeGreaterThanOrEqual(4.5);
    });
    it(`${mode}: brand text and buttons`, () => {
      for (const s of ['surface-page', 'surface-muted'] as const)
        expect(ratio('brand-primary', s, mode), `brand on ${s}`).toBeGreaterThanOrEqual(4.5);
      // Brand/On primary sits on a Brand/Primary fill.
      expect(ratio('brand-on-primary', 'brand-primary', mode)).toBeGreaterThanOrEqual(4.5);
      expect(ratio('text-on-brand-deep', 'surface-brand-deep', mode)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${mode}: icons need 3:1 on the page`, () => {
      expect(ratio('icon-primary', 'surface-page', mode)).toBeGreaterThanOrEqual(3);
      expect(ratio('icon-shamrock', 'surface-page', mode)).toBeGreaterThanOrEqual(3);
      expect(ratio('accent-success', 'surface-page', mode)).toBeGreaterThanOrEqual(3);
    });
  }
  it('the AA variants pass where the Figma values do not', () => {
    for (const mode of ['light', 'dark'] as Mode[])
      for (const s of ['surface-page', 'surface-muted', 'surface-gray', 'surface-green', 'surface-purple'] as const)
        expect(ratio('text-muted-strong', s, mode), `${mode} muted-strong on ${s}`).toBeGreaterThanOrEqual(4.5);
    expect(ratio('text-success', 'surface-page', 'light')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('text-success', 'surface-page', 'dark')).toBeGreaterThanOrEqual(4.5);
  });
  it('light: Text/Muted is not for Gray, Green or Purple surfaces (below 4.5:1)', () => {
    for (const s of ['surface-gray', 'surface-green', 'surface-purple'] as const)
      expect(ratio('text-muted', s, 'light')).toBeLessThan(4.5);
  });
  it('light: Accent/Success is for icons and strokes only (below 4.5:1 on the page)', () => {
    expect(ratio('accent-success', 'surface-page', 'light')).toBeLessThan(4.5);
  });
});

describe('website link text (D-562)', () => {
  it('passes AA on every surface a link sits on, in both themes, and on the row hover', () => {
    for (const mode of ['light', 'dark'] as Mode[])
      for (const s of ['surface-page', 'surface-muted', 'surface-gray', 'surface-brand-soft'] as const)
        expect(ratio('text-link', s, mode), `${mode} text-link on ${s}`).toBeGreaterThanOrEqual(4.5);
  });
  it('light is the brand green; dark is not the lime brand colour (that stays for icons and fills)', () => {
    expect(c['text-link'].light).toBe(c['brand-primary'].light);
    expect(c['text-link'].dark).not.toBe(c['brand-primary'].dark);
  });
  it('dark: close to white text, so a link needs more than colour (under 1.3:1 apart)', () => {
    const white = parse(c['text-primary'].dark).slice(0, 3);
    const link = parse(c['text-link'].dark).slice(0, 3);
    const hi = Math.max(lum(white), lum(link));
    const lo = Math.min(lum(white), lum(link));
    expect((hi + 0.05) / (lo + 0.05)).toBeLessThan(1.3);
  });
});

describe('Support search pill (Iris H2)', () => {
  // Placeholder colours as the built /support/ page computes them (measured in Chromium, 11 October):
  // the theme's secondary text on SearchPill's own fill (`light-dark(#FFFFFF, #262626)`). The scan
  // misses a placeholder when it is not on screen, so the pairing is pinned here.
  const flat = (fg: string, bg: string) => {
    const hi = Math.max(lum(parse(fg).slice(0, 3)), lum(parse(bg).slice(0, 3)));
    const lo = Math.min(lum(parse(fg).slice(0, 3)), lum(parse(bg).slice(0, 3)));
    return (hi + 0.05) / (lo + 0.05);
  };
  it('light: placeholder and icon on the white pill', () => {
    expect(flat('#474747', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(flat('#6A6A6A', '#FFFFFF')).toBeGreaterThanOrEqual(3);
  });
  it('dark: placeholder and icon on the #262626 pill, and on the page behind it', () => {
    expect(flat('#9E9E9E', '#262626')).toBeGreaterThanOrEqual(4.5);
    expect(flat('#9E9E9E', c['surface-page'].dark)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('website tokens: files agree', () => {
  const css = readFileSync(new URL('../src/lib/website.stylex.ts', import.meta.url), 'utf8');
  it('every palette entry is in website.stylex.ts with the same values', () => {
    for (const [name, v] of Object.entries(c))
      expect(css).toContain(`'--website-${name}': 'light-dark(${v.light}, ${v.dark})'`);
    expect((css.match(/'--website-/g) ?? []).length).toBe(Object.keys(c).length);
  });
  it('has the 32 Figma text styles', () => {
    const t = readFileSync(new URL('../src/lib/website-type.stylex.ts', import.meta.url), 'utf8');
    expect((t.match(/^ {2}\w+: \{$/gm) ?? []).length).toBe(32);
  });
});

// a83 (Will, 13 October): the grey "Still stuck?" card is 60px above the footer on a phone and 120px from 900px.
describe('website spacing: the space under the Still stuck? card', () => {
  const source = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
  it('names 60px for a phone and 120px for desktop, and the footer gap it counts', () => {
    const s = source('../src/lib/website-space.stylex.ts');
    expect(s).toMatch(/stillStuckGapPhone: '60px'/);
    expect(s).toMatch(/stillStuckGapDesktop: '120px'/);
    expect(s).toMatch(/footerGapDesktop: '64px'/);
  });
  it('is used by the containers that end the page, as padding, from the one place at the one breakpoint', () => {
    const gap = source('../src/lib/last-block-gap.ts');
    const post = source('../src/screens/PostScreen.tsx');
    const support = source('../src/screens/SupportScreen.tsx');
    const foot = source('../src/components/SiteFooter.tsx');
    expect(gap).toMatch(/space\.stillStuckGapPhone/);
    expect(gap).toMatch(/space\.stillStuckGapDesktop/);
    expect(gap).toMatch(/space\.footerGapDesktop/);
    expect(gap).toMatch(/min-width: 900px/);
    // padding on the container, never a margin an engine can drop (Will, 14 October)
    expect(gap).toMatch(/paddingBlockEnd/);
    expect(gap).not.toMatch(/marginBlockEnd:/);
    expect(foot).toMatch(/space\.footerGapDesktop/);
    // a post (with the card or without it, like Your safety) and the Support page end the same way
    expect(post).toMatch(/styles\.column, lastBlockGap\.end/);
    expect(support).toMatch(/lastBlockGap\.end/);
    expect(gap + post + support + foot).not.toMatch(/!important/);
  });
});
