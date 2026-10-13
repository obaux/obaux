import * as stylex from '@stylexjs/stylex';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';

const styles = stylex.create({
  // One post in a list (Figma "Post link"): a newspaper mark, the title, a chevron, a hairline under it. 48px tall at least.
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '48px',
    boxSizing: 'border-box',
    paddingBlock: '12px',
    paddingInline: { default: '8px', '@media (min-width: 900px)': '24px' },
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: website['--website-border-subtle'],
    color: website['--website-brand-primary'],
    textDecorationLine: 'none',
    backgroundColor: { default: 'transparent', ':hover': website['--website-surface-brand-soft'] },
    transitionProperty: 'background-color',
    transitionDuration: '125ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  title: { flex: 1, minWidth: 0, overflowWrap: 'anywhere' },
  icon: { flexShrink: 0, width: '20px', height: '20px' },
});

function Paper() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...stylex.props(styles.icon)}>
      <path d="M4 5h13v14H6a2 2 0 0 1-2-2V5Z" />
      <path d="M17 9h3v8a2 2 0 0 1-2 2h-1" />
      <path d="M8 9h6M8 13h6" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...stylex.props(styles.icon)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** A post link as a row. */
export function PostRow({ href, title }: { readonly href: string; readonly title: string }) {
  return (
    <a href={href} {...stylex.props(styles.row, type.label_14)}>
      <Paper />
      <span {...stylex.props(styles.title)}>{title}</span>
      <Chevron />
    </a>
  );
}
