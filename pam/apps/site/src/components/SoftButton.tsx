import * as stylex from '@stylexjs/stylex';
import type { ComponentProps } from 'react';
import { Button } from '@pam/ui/Button';
import { tap } from '../lib/tap';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';

const styles = stylex.create({
  // The design's secondary button: a soft green fill, a hairline, 17px semibold. The target is 48px.
  soft: {
    backgroundColor: website['--website-surface-brand-soft'],
    color: website['--website-text-primary'],
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: website['--website-border-subtle'],
    borderRadius: '15px',
    paddingInline: '18px',
  },
});

type Props = Omit<ComponentProps<typeof Button>, 'variant'> & {
  /** The small one under a callout (Figma: 36px high, 14px label, radius 10). Its tap box is still 48px high. */
  readonly compact?: boolean;
};

const compactStyles = stylex.create({
  box: { display: 'inline-flex', alignItems: 'center', minHeight: '48px', textDecorationLine: 'none', borderRadius: '12px' },
  face: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    minHeight: '36px',
    paddingInline: '12px',
    borderRadius: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: website['--website-border-subtle'],
    backgroundColor: website['--website-surface-brand-soft'],
    color: website['--website-text-primary'],
    transitionProperty: 'transform',
    transitionDuration: '125ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    transform: { default: 'none', ':active': 'scale(0.97)' },
  },
});

/** The new site's secondary button (Figma "Button / Secondary"), on the design system's Button so press, focus and keyboard are the app's. */
export function SoftButton({ xstyle, compact = false, ...props }: Props) {
  if (compact && props.href) {
    return (
      <a href={props.href} {...stylex.props(compactStyles.box)}>
        <span {...stylex.props(type.label_14, compactStyles.face)}>{props.label}</span>
      </a>
    );
  }
  return <Button {...props} variant="secondary" hasEdge={false} xstyle={[type.label_strong17, styles.soft, tap.target, xstyle]} />;
}
