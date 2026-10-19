'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { colorVars, fontWeightVars, radiusVars, shadowVars } from '@astryxdesign/core/theme/tokens.stylex';
import { useI18n } from './i18n';

/**
 * Every alert in the app is Astryx's `Banner` in red (D-621; Will, 19 October: "The blue variant (but in red) is the style of alert banner I want
 * to use across the entire app."): the failure banner (D-618) and the status notices (D-619) are drawn here, as `Banner status="error"`: the
 * tinted ground, the icon and title in the status colour, the line, the actions at the end, and a close only for what is a one-off.
 * It floats at the bottom of the screen over real content, so it sits on an opaque backing of the page's own colour (the tint alone is see-through)
 * with the radius and shadow of a floating card. `Banner` gives `role="alert"`, so every alert is announced at once, calm states included.
 * Loaded with the rest of the stack, once the page is idle, so it is not in the root bundle.
 */
const styles = stylex.create({
  // `Banner`'s own title and line are small (14 and 12px). Pam's reading text is 16px (A23, and D-432's quiet notices), so the words are set at that.
  title: { fontSize: '16px', fontWeight: fontWeightVars['--font-weight-semibold'], lineHeight: 1.35 },
  line: { fontSize: '16px', lineHeight: 1.4 },
  // Every control is a 48px target, including the one a person reaches for when something has gone wrong (§2.5).
  action: { minHeight: '48px' },
  // Quiet (D-432): the call reads as a link, not a button, at the same 16px and 48px.
  link: { minHeight: '48px', fontSize: '16px', textDecorationLine: 'underline' },
  backing: {
    width: '100%',
    backgroundColor: colorVars['--color-background-body'],
    borderRadius: radiusVars['--radius-container'],
    boxShadow: shadowVars['--shadow-high'],
  },
});

/** The look every control inside the banner takes, so a button there is 48px. */
export const bannerAction = styles.action;
export const bannerLink = styles.link;

export interface StackBannerProps {
  readonly title: string;
  readonly description?: string | undefined;
  /** The way out: Try again, Sign in, Show the latest, Get help, Contact Pam. */
  readonly actions?: ReactNode;
  /** A one-off the person may close; a state that lasts has no close. */
  readonly onClose?: (() => void) | undefined;
  /** For the tests and the pictures: this banner is the failure banner. */
  readonly failure?: boolean;
}

export function StackBanner({ title, description, actions, onClose, failure = false }: StackBannerProps) {
  const { tPlain } = useI18n();
  return (
    <div {...stylex.props(styles.backing)} {...(failure ? { 'data-pam-malfunction': '' } : {})}>
      <Banner
        status="error"
        title={<span role="heading" aria-level={2} {...stylex.props(styles.title)}>{title}</span>}
        description={description ? <span {...stylex.props(styles.line)}>{description}</span> : undefined}
        endContent={actions}
        isDismissable={onClose !== undefined}
        dismissLabel={tPlain('common.dismiss')}
        {...(onClose ? { onDismiss: onClose } : {})}
        elevation="none"
      />
    </div>
  );
}
