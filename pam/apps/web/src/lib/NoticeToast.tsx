'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars, fontWeightVars, radiusVars, shadowVars, spacingVars, textSizeVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Button } from '@pam/ui/Button';
import { HelpIcon } from '@pam/ui/icons';
import type { NoticeToastSpec } from '@pam/ui/noticeSink';
import { useI18n } from './i18n';

/**
 * One status `Notice` as a toast (D-619; Will, 19 October: "I want to stop using this style. Please use the toast banner instead.").
 * Astryx's toast look, drawn here from Astryx's own primitives and tokens and not by Astryx's `Toast` component, whose modules (the swipe, the
 * timers, the top-layer viewport, `MediaTheme`) add 4.5 kB gz to the first load: the inverse-of-the-page surface for a calm state, the error
 * surface for a fault. What is in it is what the `Notice` card said: an icon, the title, the line, "Try again" and "Contact Pam" as 48px
 * controls. `userFacingNote` has already replaced the body before it gets here, and the internal reason never does.
 *
 * A state that lasts has no close and there is no swipe at all: it goes when the state ends (the `Notice` unmounts). A one-off has a close.
 * An error is announced at once (`role="alert"`); a calm state (a warning or information) is said once, politely (`role="status"`).
 */
const ICON = { error: 'error', warning: 'warning', info: 'info' } as const;

const styles = stylex.create({
  row: { width: '100%' },
  words: { flexGrow: 1, minWidth: 0 },
  title: { fontSize: textSizeVars['--font-size-lg'], lineHeight: 1.3, fontWeight: fontWeightVars['--font-weight-semibold'], margin: 0, color: 'inherit' },
  // 16px is Pam's reading size (A23); Astryx's own base is 14px and its next step 17px, so this one is Pam's number, not a token's.
  body: { fontSize: '16px', lineHeight: 1.4, color: 'inherit' },
  action: { minHeight: spacingVars['--spacing-12'], fontSize: '16px', fontWeight: fontWeightVars['--font-weight-semibold'] },
  link: { minHeight: spacingVars['--spacing-12'], fontSize: '16px', textDecorationLine: 'underline', color: 'inherit' },
  close: { minHeight: spacingVars['--spacing-12'], minWidth: spacingVars['--spacing-12'], flexShrink: 0, color: 'inherit' },
  card: { boxSizing: 'border-box', width: '100%', padding: spacingVars['--spacing-4'], borderRadius: radiusVars['--radius-container'], boxShadow: shadowVars['--shadow-high'] },
  // The inverse of the page, so its words are the page's own colour (light on dark in light mode, dark on light in dark mode).
  calmCard: { backgroundColor: colorVars['--color-background-inverted'], color: colorVars['--color-background-body'] },
  errorCard: { backgroundColor: colorVars['--color-error'], color: colorVars['--color-on-error'] },
});

export function NoticeToast({ spec, onClose }: { readonly spec: NoticeToastSpec; readonly onClose: () => void }) {
  const { tPlain } = useI18n();
  const error = spec.status === 'error';
  const content = (
    <HStack gap={2} align="start" wrap="nowrap" xstyle={styles.row}>
      <Icon icon={ICON[spec.status]} color="inherit" />
      <VStack gap={1} xstyle={styles.words}>
        <Heading level={2} xstyle={styles.title}>
          {spec.title}
        </Heading>
        {spec.body ? <Text xstyle={styles.body}>{spec.body}</Text> : null}
        {spec.retry || spec.contact ? (
          <HStack gap={2} wrap="wrap" align="center">
            {spec.retry ? <Button label={spec.retry.label} variant="secondary" clickAction={spec.retry.onPress} xstyle={styles.action} /> : null}
            {spec.contact ? (
              <Button
                label={spec.contact.label}
                variant={spec.quiet ? 'ghost' : 'secondary'}
                href={spec.contact.href}
                icon={<HelpIcon />}
                xstyle={spec.quiet ? styles.link : styles.action}
              />
            ) : null}
          </HStack>
        ) : null}
      </VStack>
      {spec.closable ? (
        <IconButton
          label={tPlain('common.dismiss')}
          icon={<Icon icon="close" size="sm" color="inherit" />}
          variant="ghost"
          onClick={onClose}
          xstyle={styles.close}
        />
      ) : null}
    </HStack>
  );
  return (
    <div
      role={error ? 'alert' : 'status'}
      aria-live={error ? 'assertive' : 'polite'}
      aria-atomic="true"
      {...stylex.props(styles.card, error ? styles.errorCard : styles.calmCard)}
    >
      {content}
    </div>
  );
}
