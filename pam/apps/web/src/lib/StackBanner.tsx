'use client';

import { type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { colorVars, radiusVars, shadowVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { useI18n } from './i18n';

/**
 * Every alert in the app is Astryx's `Banner` in red (D-621; Will, 19 October: "The blue variant (but in red) is the style of alert banner I want
 * to use across the entire app."): the failure banner (D-618) and the status notices (D-619) are drawn here, as `Banner status="error"`: the
 * tinted ground, the icon and title in the status colour, the line with the actions in a quiet row under it, and a close at the top corner only for what is a one-off.
 * It floats at the bottom of the screen over real content, so it sits on an opaque backing of the page's own colour (the tint alone is see-through)
 * with the radius and shadow of a floating card. `Banner` gives `role="alert"`, so every alert is announced at once, calm states included.
 * Loaded with the rest of the stack, once the page is idle, so it is not in the root bundle.
 */
const styles = stylex.create({
  // Quiet and symmetrical (Will, 19 October, 04:51: "action buttons are symmetrical and not overly loud"): a ghost button at Astryx's small size,
  // in the banner's red with a thin red edge. Two sit side by side at the same width; one sits alone at its own width, under the line.
  action: {
    color: colorVars['--color-text-red'],
    boxShadow: `inset 0 0 0 1px ${colorVars['--color-error']}`,
    paddingInline: spacingVars['--spacing-2'],
    flexGrow: { default: 1, ':only-child': 0 },
    flexBasis: '5rem',
    minWidth: 'max-content',
  },
  // Side by side at one width when they fit, one above the other when a longer language's labels do not; never a word broken in two.
  row: { display: 'flex', flexWrap: 'wrap', width: '100%', gap: spacingVars['--spacing-2'], marginBlockStart: spacingVars['--spacing-2'] },
  backing: {
    width: '100%',
    backgroundColor: colorVars['--color-background-body'],
    borderRadius: radiusVars['--radius-container'],
    boxShadow: shadowVars['--shadow-high'],
  },
});

/** The look every button inside the banner takes. */
export const bannerAction = styles.action;

export interface StackBannerProps {
  readonly title: string;
  readonly description?: string | undefined;
  /** The way out: Try again, Sign in, Show the latest, Get help, Contact Pam. */
  readonly actions?: readonly ReactNode[] | undefined;
  /** A one-off the person may close; a state that lasts has no close. */
  readonly onClose?: (() => void) | undefined;
  /** For the tests and the pictures: this banner is the failure banner. */
  readonly failure?: boolean;
}

export function StackBanner({ title, description, actions, onClose, failure = false }: StackBannerProps) {
  const { tPlain } = useI18n();
  // The actions go under the line, inside the description, so the end of the banner holds only the close, at the top corner (D-621, Will 04:51).
  const body = (
    <>
      {description}
      {actions ? <span {...stylex.props(styles.row)}>{actions}</span> : null}
    </>
  );
  return (
    <div {...stylex.props(styles.backing)} {...(failure ? { 'data-pam-malfunction': '' } : {})}>
      <Banner
        status="error"
        title={<span role="heading" aria-level={2}>{title}</span>}
        description={description || actions ? body : undefined}
        isDismissable={onClose !== undefined}
        dismissLabel={tPlain('common.dismiss')}
        {...(onClose ? { onDismiss: onClose } : {})}
        elevation="none"
      />
    </div>
  );
}
