import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

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
}

const styles = stylex.create({
  card: { width: '100%' },
  art: {
    width: '96px',
    height: '96px',
    flexShrink: 0,
    borderRadius: '18px',
    color: colorVars['--color-icon-accent'],
    backgroundColor: colorVars['--color-background-muted'],
  },
  body: { minWidth: 0, flexGrow: 1 },
  name: { fontSize: '20px', lineHeight: 1.25, fontWeight: 700 },
  when: { fontSize: '16px', lineHeight: 1.35 },
});

export function TripCard({ placeName, when, href, art, withName, withPhotoUrl, label }: TripCardProps) {
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
          {withName ? (
            <Avatar size="sm" name={withName} src={withPhotoUrl ?? undefined} tooltip={false} alt="" />
          ) : null}
        </VStack>
      </HStack>
    </ClickableCard>
  );
}
