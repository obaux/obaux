import * as stylex from '@stylexjs/stylex';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Icon } from '@astryxdesign/core/Icon';
import { Button } from '@astryxdesign/core/Button';
import { PhoneIcon } from './icons.js';
import { NOTICES, type NoticeKey } from '@pam/config';

/**
 * How PAM says something went wrong, or that there is nothing here.
 *
 * A query that returns null because an admin is out of region, or empty because
 * a feature was turned off, renders as a blank screen unless something says
 * otherwise. §0 forbids that: "Never dead-end. Every screen has a visible way
 * back and a visible 'Get help'."
 *
 * The copy and the rules behind it live in `@pam/config/notices` — this only
 * decides how it looks. Two shapes, following Astryx's own guidance:
 *
 *   a status card — a problem the reader has to act on, carrying `role="alert"`
 *     so a screen reader announces it (WCAG 4.1.3).
 *   EmptyState — an area with no data, explaining why rather than showing a
 *     blank list. Astryx: "always explain what happened and what the user can
 *     do next."
 *
 * The status card is composed from Card, Text and Button rather than Astryx's
 * `Banner`, which is otherwise the right component. Banner's dismiss control
 * carries a tooltip, so importing it drags in the whole overlay/layer
 * subsystem: 125 kB gzipped, a quarter of the §12 first-load budget, and enough
 * on its own to put the app over it. A message that has to work when everything
 * else has failed is the wrong place to spend that. What Banner gave us that
 * matters — the alert role, the status colour, the icon — is a few lines here.
 *
 * The support call is a real `tel:` anchor, not a handler, so it works with no
 * JavaScript, no network and no session — which is the state someone is most
 * likely to be in when they need it.
 */
export interface NoticeProps {
  notice: NoticeKey;
  /** Localised title and body, resolved by the caller through i18n. */
  title: string;
  body: string;
  /** PAM's support line in E.164. Omit to hide the call action. */
  supportPhone?: string | null;
  /** Localised label for the call action, e.g. "Call PAM". */
  callLabel?: string;
  /**
   * An admin's own note to this person, from `access_controls.user_facing_note`.
   * Shown instead of the generic body when present.
   *
   * The internal `reason` on that row is NEVER passed here — §4.1 promises the
   * subject sees a plain note, not the justification written about them.
   */
  userFacingNote?: string | null;
  /** Optional extra action, e.g. "Try again". Rendered before the call button. */
  retry?: { label: string; onPress: () => void };
}

const styles = stylex.create({
  // §2.5 — every control here clears the minimum target, including the one
  // someone reaches for when they are already stuck.
  action: { minHeight: '48px', fontSize: '17px' },
  block: { width: '100%' },
  title: { fontSize: '19px', lineHeight: 1.3 },
  body: { fontSize: '17px', lineHeight: 1.5 },
  // A coloured edge rather than a coloured fill: it survives a high-contrast
  // mode, and it never fights the text for contrast (§2.5 wants AAA body text).
  card: {
    width: '100%',
    borderInlineStartWidth: '4px',
    borderInlineStartStyle: 'solid',
  },
  error: { borderInlineStartColor: 'var(--color-text-error, currentColor)' },
  warning: { borderInlineStartColor: 'var(--color-text-warning, currentColor)' },
  info: { borderInlineStartColor: 'var(--color-text-accent, currentColor)' },
});

/**
 * Astryx's semantic status icons and the matching icon colour. Decorative — the
 * title carries the meaning, which is why Astryx tells you not to rely on the
 * icon alone. Astryx has no 'info' icon colour, so informational notices use
 * the accent.
 */
const STATUS_ICON = { error: 'error', warning: 'warning', info: 'info' } as const;
const STATUS_ICON_COLOR = { error: 'error', warning: 'warning', info: 'accent' } as const;

export function Notice({
  notice,
  title,
  body,
  supportPhone,
  callLabel = 'Call PAM',
  userFacingNote,
  retry,
}: NoticeProps) {
  const definition = NOTICES[notice];
  const message = userFacingNote?.trim() || body;

  const actions = (
    <>
      {retry ? (
        <Button
          label={retry.label}
          variant="secondary"
          clickAction={retry.onPress}
          xstyle={styles.action}
        />
      ) : null}
      {definition.offersSupport && supportPhone ? (
        <Button
          label={callLabel}
          variant="primary"
          href={`tel:${supportPhone}`}
          icon={<PhoneIcon />}
          xstyle={styles.action}
        />
      ) : null}
    </>
  );

  const hasActions = Boolean(retry) || (definition.offersSupport && Boolean(supportPhone));

  if (definition.kind === 'empty') {
    return (
      <EmptyState
        title={title}
        description={message}
        headingLevel={2}
        actions={hasActions ? actions : undefined}
        xstyle={styles.block}
      />
    );
  }

  return (
    <Card
      padding={4}
      xstyle={[styles.card, styles[definition.status]]}
      // Errors and warnings interrupt; an informational note is announced when
      // the reader gets to it. Nothing here is dismissable — a member should not
      // be able to swipe away the reason their account is paused.
      role={definition.status === 'info' ? 'status' : 'alert'}
    >
      <VStack gap={2}>
        <HStack gap={2} align="center">
          <Icon icon={STATUS_ICON[definition.status]} color={STATUS_ICON_COLOR[definition.status]} />
          <Heading level={2} xstyle={styles.title}>
            {title}
          </Heading>
        </HStack>
        <Text xstyle={styles.body}>{message}</Text>
        {hasActions ? (
          <HStack gap={2} wrap="wrap">
            {actions}
          </HStack>
        ) : null}
      </VStack>
    </Card>
  );
}
