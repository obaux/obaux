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

type Props = Omit<ComponentProps<typeof Button>, 'variant'>;

/** The new site's secondary button (Figma "Button / Secondary"), on the design system's Button so press, focus and keyboard are the app's. */
export function SoftButton({ xstyle, ...props }: Props) {
  return <Button {...props} variant="secondary" hasEdge={false} xstyle={[type.label_strong17, styles.soft, tap.target, xstyle]} />;
}
