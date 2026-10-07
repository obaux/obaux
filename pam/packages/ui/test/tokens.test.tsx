import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `src/styles/tokens.css` is the one place every token is written down for
 * anything reading the system from outside (Claude Design, an inspector). It
 * is generated; this fails when a theme or measurement changed and nobody
 * re-ran `pnpm --filter @pam/ui tokens`.
 */
const pkg = join(__dirname, '..');

describe('tokens.css', () => {
  it('matches its sources', () => {
    expect(() =>
      execFileSync(process.execPath, [join(pkg, 'scripts/tokens.mjs'), '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });

  it('carries every family the system is built from', () => {
    const css = readFileSync(join(pkg, 'src/styles/tokens.css'), 'utf8');
    for (const token of [
      '--color-accent',
      '--color-background-body',
      '--spacing-4',
      '--radius-container',
      '--font-family-body',
      '--text-body-size',
      '--shadow-low',
      '--pam-touch-target-min',
      '--pam-big-button-height',
    ]) {
      expect(css).toContain(`${token}:`);
    }
  });
});
