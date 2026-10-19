'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars, fontWeightVars, radiusVars, shadowVars, spacingVars, textSizeVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Button } from '@pam/ui/Button';
import { useI18n } from './i18n';

/**
 * The banner a failed save, switch or send raises (D-618; Will, 19 October: "use the other alert banner style (ensure it fits properly on
 * screen), and if saying something didn't work, please let users know how to resolve it"). The style is the alert banner's (`AlertBannerHost`,
 * 16 September): a solid error ground with its own text colour, a title, a line, an action and a close, in role="alert". It is drawn here at
 * the bottom of the screen and not at the top of the page (Will, 18 October, 21:14: "overlaid below at bottom of page"), so it has a
 * surface of its own and a radius. Loaded the first time a failure is shown, like the banner at the top, so it is not in the root bundle.
 */

export interface MalfunctionBannerAction {
  readonly label: string;
  readonly onPress: () => void;
}

export interface MalfunctionBannerProps {
  readonly title: string;
  readonly body?: string | undefined;
  readonly actions: readonly MalfunctionBannerAction[];
  /** `fault` is the red card (something failed); `calm` is the inverse-of-the-page card (nothing broke: the person is early, offline, signed out…). */
  readonly tone: 'fault' | 'calm';
  readonly onClose: () => void;
}

const styles = stylex.create({
  banner: {
    width: '100%',
    maxWidth: '560px',
    boxSizing: 'border-box',
    paddingBlock: spacingVars['--spacing-2'],
    paddingInlineStart: spacingVars['--spacing-4'],
    paddingInlineEnd: spacingVars['--spacing-1'],
    borderRadius: radiusVars['--radius-container'],
    boxShadow: shadowVars['--shadow-high'],
    // The host takes no taps (the page under it stays usable); the banner does.
    pointerEvents: 'auto',
  },
  // Red is for a fault: something that failed on Pam's side or in the connection (server, timeout). Everything else (offline, signed out, not
  // allowed, a limit, already changed, gone, not at this time, check what you chose) is a calm card, the inverse of the page.
  fault: { backgroundColor: colorVars['--color-error'], color: colorVars['--color-on-error'] },
  calm: { backgroundColor: colorVars['--color-background-inverted'], color: colorVars['--color-background-body'] },
  words: { flexGrow: 1, minWidth: 0, paddingBlock: spacingVars['--spacing-2'] },
  // 16px is Pam's reading size (A23); Astryx has no token for it.
  title: { fontSize: '16px', fontWeight: fontWeightVars['--font-weight-semibold'], lineHeight: 1.35, color: 'inherit' },
  body: { fontSize: textSizeVars['--font-size-base'], lineHeight: 1.4, color: 'inherit' },
  action: { minHeight: spacingVars['--spacing-12'], fontSize: '16px', fontWeight: fontWeightVars['--font-weight-semibold'], paddingInline: spacingVars['--spacing-3'], color: 'inherit' },
  close: { minHeight: spacingVars['--spacing-12'], minWidth: spacingVars['--spacing-12'], flexShrink: 0, color: 'inherit' },
});

export function MalfunctionBanner({ title, body, actions, tone, onClose }: MalfunctionBannerProps) {
  const { tPlain } = useI18n();
  return (
    <div role="alert" data-pam-malfunction {...stylex.props(styles.banner, tone === 'fault' ? styles.fault : styles.calm)}>
      <HStack gap={1} align="start" wrap="nowrap">
        <VStack gap={1} xstyle={styles.words}>
          <Text xstyle={styles.title}>{title}</Text>
          {body ? <Text xstyle={styles.body}>{body}</Text> : null}
          {actions.length > 0 ? (
            <HStack gap={1} wrap="wrap" align="center">
              {actions.map((action) => (
                <Button key={action.label} label={action.label} variant="ghost" onClick={action.onPress} xstyle={styles.action} />
              ))}
            </HStack>
          ) : null}
        </VStack>
        <IconButton
          label={tPlain('common.dismiss')}
          icon={<Icon icon="close" size="sm" color="inherit" />}
          variant="ghost"
          onClick={onClose}
          xstyle={styles.close}
        />
      </HStack>
    </div>
  );
}
