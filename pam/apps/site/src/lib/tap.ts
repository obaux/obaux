import * as stylex from '@stylexjs/stylex';

/**
 * A finger-sized target (the 48px rule, CLAUDE.md; Iris's finding W4, 11 October: the header's Support and Sign in
 * were 32px high, a lone link 20px). `target` is for a button or box, `link` for a link that sits on a line of its own:
 * it keeps the text where it was and makes the tappable line 48px tall.
 */
export const tap = stylex.create({
  target: { minHeight: '48px' },
  link: { display: 'inline-flex', alignItems: 'center', minHeight: '48px' },
});
