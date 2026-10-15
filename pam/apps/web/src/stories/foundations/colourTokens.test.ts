import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseColourTokens } from './colourTokens';
import { COLOUR_TOKENS } from './colourTokens.generated';

describe('the Colour page reads the theme', () => {
  it('splits a light-dark pair at the right comma, brackets and all', () => {
    const tokens = parseColourTokens(`
      --color-background-body: light-dark(#FFFFFF, #1B1B1B);
      --color-overlay: light-dark(oklch(0 0 0 / 5%), oklch(1 0 0 / 8%));
      --color-warning: #ffce2f;
    `);
    expect(tokens.find((t) => t.name === '--color-background-body')).toMatchObject({ light: '#FFFFFF', dark: '#1B1B1B', group: 'background' });
    expect(tokens.find((t) => t.name === '--color-overlay')).toMatchObject({ light: 'oklch(0 0 0 / 5%)', dark: 'oklch(1 0 0 / 8%)' });
    expect(tokens.find((t) => t.name === '--color-warning')).toMatchObject({ light: '#ffce2f', dark: '#ffce2f' });
  });

  it('keeps the first definition of a token, not a later one for one component', () => {
    const tokens = parseColourTokens('--color-border: #111111;\n  .x { --color-border: #222222; }');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]!.light).toBe('#111111');
  });

  it("lists every token the theme defines: the Colour page is not out of date", () => {
    const css = readFileSync(join(__dirname, '..', '..', '..', '..', '..', 'packages', 'ui', 'src', 'theme', 'pam.css'), 'utf8');
    // If this fails, run: pnpm --filter @pam/web tokens:colours
    expect(COLOUR_TOKENS).toEqual(parseColourTokens(css));
    expect(COLOUR_TOKENS.length).toBeGreaterThan(100);
  });
});
