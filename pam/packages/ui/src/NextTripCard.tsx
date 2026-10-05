import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * A member's next visit, on Explore (Will, 5 October, D-265): one wide card
 * like the reference's "View trip details" — the kind of program and its
 * icon on a small line, a bold title, then the day and time with a chevron;
 * at the right, the category's picture on two stacked, tilted tiles. No
 * program name: this is a nudge about *when*, and the name is one tap away.
 */
export interface NextTripCardProps {
  /** "School and training". */
  readonly categoryLabel: string;
  /** The category's icon, at 20px, coloured. */
  readonly categoryIcon: ReactNode;
  /** The same icon drawn large for the picture. */
  readonly art: ReactNode;
  /** "Your next visit". */
  readonly title: string;
  /** "Tue, Oct 7 · 10:00 AM". */
  readonly when: string;
  readonly href: string;
  /** The whole card read out — "Your next visit: School and training, Tue …". */
  readonly label: string;
}

const styles = stylex.create({
  card: { width: '100%' },
  body: { minWidth: 0, flexGrow: 1 },
  kind: { fontSize: '15px', lineHeight: 1.3, color: colorVars['--color-text-secondary'] },
  kindIcon: { width: '20px', height: '20px', flexShrink: 0 },
  title: { fontSize: '22px', lineHeight: 1.2, fontWeight: 700 },
  when: { fontSize: '16px', lineHeight: 1.35 },
  // Two tiles, the back one turned a little — the reference's stacked photos.
  stack: { position: 'relative', width: '96px', height: '96px', flexShrink: 0, marginInlineEnd: '6px' },
  tile: {
    position: 'absolute',
    inset: 0,
    borderRadius: '18px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-background-body'],
    boxShadow: '0 4px 14px light-dark(oklch(0 0 0 / 14%), oklch(0 0 0 / 45%))',
  },
  back: { transform: 'rotate(-7deg)', backgroundColor: colorVars['--color-background-muted'] },
  front: {
    transform: 'rotate(3deg)',
    // White, so the category's own colour and glow carry it (D-293); the
    // white rim and shadow still lift it off the card.
    backgroundColor: colorVars['--color-background-card'],
    color: colorVars['--color-icon-accent'],
  },
});

export function NextTripCard({ categoryLabel, categoryIcon, art, title, when, href, label }: NextTripCardProps) {
  return (
    <ClickableCard label={label} href={href} padding={5} xstyle={styles.card}>
      <HStack gap={3} align="center" wrap="nowrap">
        <VStack gap={1.5} xstyle={styles.body}>
          <HStack gap={1.5} align="center" wrap="nowrap">
            <HStack align="center" justify="center" xstyle={styles.kindIcon}>
              {categoryIcon}
            </HStack>
            <Text xstyle={styles.kind}>{categoryLabel}</Text>
          </HStack>
          <Heading level={2} xstyle={styles.title}>
            {title}
          </Heading>
          <HStack gap={1} align="center" wrap="nowrap">
            <Text type="supporting" xstyle={styles.when}>
              {when}
            </Text>
            <Icon icon="chevronRight" size="sm" color="secondary" />
          </HStack>
        </VStack>
        <HStack xstyle={styles.stack} aria-hidden>
          <HStack xstyle={[styles.tile, styles.back]} />
          <HStack align="center" justify="center" xstyle={[styles.tile, styles.front]}>
            {art}
          </HStack>
        </HStack>
      </HStack>
    </ClickableCard>
  );
}
