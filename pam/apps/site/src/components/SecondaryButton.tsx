import * as stylex from '@stylexjs/stylex';
import type { ComponentProps } from 'react';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Button } from '@pam/ui/Button';

const styles = stylex.create({
  // A secondary button has a pale fill that all but disappears on a gray card or page (Will, 10 October
  // 2026), so on the site it has a light border. This is the site's, not the design system's: the app's own
  // secondary buttons (language chips among them) are unchanged until the design system lane decides.
  border: { borderWidth: '1px', borderStyle: 'solid', borderColor: colorVars['--color-border'] },
});

type Props = Omit<ComponentProps<typeof Button>, 'variant'>;

/** The design system's secondary Button, with a light border, for the public site. */
export function SecondaryButton({ xstyle, ...props }: Props) {
  return <Button {...props} variant="secondary" xstyle={[styles.border, xstyle]} />;
}
