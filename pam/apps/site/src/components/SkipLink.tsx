import * as stylex from '@stylexjs/stylex';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

const styles = stylex.create({
  // Off-screen until it has focus, then the first thing on the page (Iris's finding W6, 11 October).
  link: {
    position: 'absolute',
    insetInlineStart: '16px',
    insetBlockStart: '-80px',
    zIndex: 100,
    paddingBlock: '12px',
    paddingInline: '16px',
    minHeight: '48px',
    boxSizing: 'border-box',
    borderRadius: '8px',
    backgroundColor: colorVars['--color-background-card'],
    color: colorVars['--color-text-primary'],
    fontWeight: 600,
    textDecorationLine: 'underline',
    ':focus': { insetBlockStart: '16px' },
  },
});

/** "Skip to main content": the first stop for someone who tabs, so the header is not walked through on every page. */
export function SkipLink() {
  return (
    <a href="#main" {...stylex.props(styles.link)}>
      Skip to main content
    </a>
  );
}
