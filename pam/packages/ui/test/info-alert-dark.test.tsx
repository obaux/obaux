import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The blue (info) alert in dark mode (Will, 11 October: "the blue alert use in dark mode is too blue. Let's dim
 * that background to 10%"). Its ground is the alert blue at 10% over the page; light mode is unchanged. The words
 * on it keep AAA contrast (§2.5: 7:1 for body text).
 */
const css = readFileSync(resolve(process.cwd(), 'src/theme/pam.css'), 'utf8');

function token(name: string): { light: string; dark: string } {
  const match = new RegExp(`${name}:\\s*light-dark\\(\\s*(#[0-9a-fA-F]{6,8}),\\s*(#[0-9a-fA-F]{6,8})\\s*\\)`).exec(css);
  if (!match) throw new Error(`${name} is not a light-dark() token in pam.css`);
  return { light: match[1]!, dark: match[2]! };
}

const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const alpha = (hex: string): number => (hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1);
const lin = (c: number): number => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]: [number, number, number]): number => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a: [number, number, number], b: [number, number, number]): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
const over = (top: string, ground: [number, number, number]): [number, number, number] =>
  rgb(top).map((c, i) => c * alpha(top) + ground[i]! * (1 - alpha(top))) as [number, number, number];

describe('the blue alert in dark mode', () => {
  const muted = token('--astryx-theme-neutral-color-status-muted-accent');

  it('is the alert blue at 10% over the page; light mode is unchanged', () => {
    expect(muted.light).toBe('#b9d7ff');
    expect(muted.dark.slice(0, 7)).toBe('#88bcff');
    expect(alpha(muted.dark)).toBeCloseTo(0.1, 1);
  });

  it('keeps AAA contrast for its words and icon', () => {
    const page = rgb(token('--color-background-body').dark);
    const ground = over(muted.dark, page);
    expect(contrast(rgb(token('--color-text-blue').dark), ground)).toBeGreaterThanOrEqual(7);
    expect(contrast(rgb(token('--color-icon-blue').dark), ground)).toBeGreaterThanOrEqual(7);
  });
});
