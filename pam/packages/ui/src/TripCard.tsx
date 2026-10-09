import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from './Badge.js';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { SignIcon, SignedIcon } from './icons.js';

/**
 * One visit somebody has agreed to make (D-213, from the reference Will gave
 * on 1 October): a square picture at the left — a placeholder, the place's
 * category, until places have photos — then the place, the day and time,
 * and the face of who they are meeting. The whole card opens the place.
 */
export interface TripCardProps {
  readonly placeName: string;
  /** "Thursday, Oct 3 · 10:00 AM". */
  readonly when: string;
  readonly href: string;
  readonly art: ReactNode;
  readonly withName?: string | null;
  readonly withPhotoUrl?: string | null;
  /** The card's accessible name — "Example Learning Center, Thursday … with Sandra". */
  readonly label: string;
  /**
   * Where the program's policies stand (D-270): "Signatures needed" or
   * "Policies signed", beside who they are meeting. Omitted when the
   * program asks for none.
   */
  readonly policies?: { readonly label: string; readonly isDone: boolean } | null;
}

const styles = stylex.create({
  card: { width: '100%' },
  art: {
    width: '96px',
    height: '96px',
    flexShrink: 0,
    // 10 less than the card's own 24px corner, so the two curves sit
    // parallel (Will, 3 October).
    borderRadius: '14px',
    color: colorVars['--color-icon-accent'],
    // The category's illustration fills it (D-337); white is only the fallback.
    backgroundColor: colorVars['--color-background-card'],
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
  },
  body: { minWidth: 0, flexGrow: 1 },
  // One line, ending in "…" — a long program name no longer pushes the
  // date down (Will, 3 October). The full name is in the card's label.
  name: {
    fontSize: '17px',
    lineHeight: 1.3,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  when: { fontSize: '16px', lineHeight: 1.35 },
  token: { maxWidth: '100%' },
});

const TOKEN_ICON = { width: 14, height: 14, 'aria-hidden': true } as const;

export function TripCard({
  placeName,
  when,
  href,
  art,
  withName,
  withPhotoUrl,
  label,
  policies = null,
}: TripCardProps) {
  return (
    <ClickableCard label={label} href={href} padding={3} xstyle={styles.card}>
      <HStack gap={4} align="center" wrap="nowrap">
        <HStack align="center" justify="center" xstyle={styles.art}>
          {art}
        </HStack>
        <VStack gap={2} xstyle={styles.body}>
          <VStack gap={0.5}>
            <Heading level={3} xstyle={styles.name}>
              {placeName}
            </Heading>
            <Text type="supporting" xstyle={styles.when}>
              {when}
            </Text>
          </VStack>
          {withName || policies ? (
            <HStack gap={2} align="center" wrap="nowrap">
              {withName ? (
                <Avatar size="sm" name={withName} src={withPhotoUrl ?? undefined} tooltip={false} alt="" />
              ) : null}
              {policies ? (
                // A `Badge`, not a `Token` (D-404): a token trims its label to one
                // line with an ellipsis and has no way to say otherwise, so
                // "Signatures needed" was "Нужны подп…". A badge wraps.
                <Badge
                  variant={policies.isDone ? 'green' : 'orange'}
                  label={policies.label}
                  icon={policies.isDone ? <SignedIcon {...TOKEN_ICON} /> : <SignIcon {...TOKEN_ICON} />}
                  xstyle={styles.token}
                />
              ) : null}
            </HStack>
          ) : null}
        </VStack>
      </HStack>
    </ClickableCard>
  );
}
