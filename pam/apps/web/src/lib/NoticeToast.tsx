'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Button } from '@pam/ui/Button';
import { HelpIcon } from '@pam/ui/icons';
import type { NoticeToastSpec } from '@pam/ui/noticeSink';
import { useI18n } from './i18n';

/**
 * One status `Notice` as Astryx's toast (D-619; Will, 19 October: "I want to stop using this style. Please use the toast banner instead.").
 * The card is Astryx's own (the inverted surface, `role="alert"` for an error or a warning and `role="status"` for information); what is in
 * it is what the `Notice` card said: an icon, the title, the line, "Try again" and "Contact Pam" as 48px controls. `userFacingNote` has already
 * replaced the body before it gets here, and the internal reason never does.
 *
 * A state that lasts has no close and cannot be swiped away: the toast's own swipe-to-dismiss is always on, so for a lasting state the
 * touch that would start it is stopped before it reaches the card. It goes when the state ends (the `Notice` unmounts).
 */
const ICON = { error: 'error', warning: 'warning', info: 'info' } as const;

const styles = stylex.create({
  row: { width: '100%' },
  words: { flexGrow: 1, minWidth: 0 },
  title: { fontSize: '17px', lineHeight: 1.3, fontWeight: 600, margin: 0, color: 'inherit' },
  body: { fontSize: '16px', lineHeight: 1.4, color: 'inherit' },
  action: { minHeight: '48px', fontSize: '16px', fontWeight: 600 },
  link: { minHeight: '48px', fontSize: '16px', textDecorationLine: 'underline', color: 'inherit' },
  close: { minHeight: '48px', minWidth: '48px', flexShrink: 0, color: 'inherit' },
  card: { boxSizing: 'border-box', width: '100%', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 16px oklch(0 0 0 / 25%)' },
  // The inverse of the page, so its words are the page's own colour (light on dark in light mode, dark on light in dark mode).
  calmCard: { backgroundColor: colorVars['--color-background-inverted'], color: 'var(--color-background-body)' },
  errorCard: { backgroundColor: colorVars['--color-error'], color: colorVars['--color-on-error'] },
});

export function NoticeToast({ spec, onClose }: { readonly spec: NoticeToastSpec; readonly onClose: () => void }) {
  const { tPlain } = useI18n();
  const error = spec.status === 'error';
  const content = (
    <HStack gap={2} align="start" wrap="nowrap" xstyle={styles.row} {...(spec.status === 'warning' ? { role: 'alert' } : {})}>
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
  // The card is Astryx's toast look (the inverted surface for a calm state, the error surface for a fault) drawn here, not Astryx's `Toast`:
  // that component's own modules (the swipe, the timers, the top-layer viewport) add 4.5 kB gz to the first load, and none of it is wanted. A state
  // that lasts has no close and no swipe; a one-off has a close and no swipe. An error is announced at once, a calm state when it is reached.
  return (
    <div
      role={spec.status === 'info' ? 'status' : 'alert'}
      aria-live={error ? 'assertive' : 'polite'}
      aria-atomic="true"
      {...stylex.props(styles.card, error ? styles.errorCard : styles.calmCard)}
    >
      {content}
    </div>
  );
}
