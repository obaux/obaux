'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Press } from './motion.js';
import { pam } from './tokens.stylex.js';

/**
 * One place to go, from the home screen.
 *
 * Home is a menu, and the thing a menu has to survive is somebody who does not
 * yet know what any of the words mean. So each tile is a picture, a short name,
 * and a line saying what it is for in the member's own terms — "Places",
 * "Things near you that can help" — rather than a bare label they have to
 * translate.
 *
 * The whole card is one target, which is the point: a 48px link inside a card
 * is a small thing to hit inside a big thing that looks tappable and is not.
 * `ClickableCard` with `href` gives a real anchor underneath, so it works with
 * no JavaScript, opens in a new tab, and lands in browser history.
 *
 * `alertLabel` is for things waiting — unread notifications. It is drawn as a
 * dot and announced as words: the dot says "there is something here" at a
 * glance, and the tile's accessible name carries "2 new" for anybody who
 * cannot see it. A coloured dot on its own would be meaning carried by shape
 * and colour alone, which WCAG 1.4.1 forbids, and a number nobody acts on
 * differently is a second thing to read for nothing (Will, 13 September).
 */
export interface NavTileProps {
  readonly href: string;
  /** Short name, e.g. "Places". This is the tile's accessible name. */
  readonly label: string;
  /** One line, plain language, saying what it is for. */
  readonly description: string;
  /** Drawn from the icon set. Decorative — the label carries the meaning. */
  readonly icon: ReactNode;
  /**
   * Already-filled, e.g. "2 new". Drawn as a dot and added to the tile's
   * accessible name. Omit when nothing is waiting.
   */
  readonly alertLabel?: string;
}

const styles = stylex.create({
  card: { width: '100%' },
  // A whole card is the target, so it clears the floor several times over — but
  // stated, because a tile with a one-word description could otherwise shrink
  // under it.
  body: { minHeight: pam.touchTargetMin },
  art: {
    fontSize: '28px',
    lineHeight: 1,
    // The theme's accent, which is the logo's green in both modes. Naming a hex
    // here would be a second place for the brand to live, and the two would
    // drift the first time one of them moved.
    color: colorVars['--color-icon-accent'],
  },
  label: { fontSize: '18px', fontWeight: 600 },
  dot: {
    // The description can run to two lines; the dot never gives up its space.
    flexShrink: 0,
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: colorVars['--color-accent'],
  },
  description: { fontSize: '15px', lineHeight: 1.4 },
});

export function NavTile({ href, label, description, icon, alertLabel }: NavTileProps) {
  return (
    <Press>
    <ClickableCard
      label={alertLabel ? `${label}, ${alertLabel}` : label}
      href={href}
      padding={4}
      xstyle={styles.card}
    >
      <HStack gap={3} align="center" wrap="nowrap" xstyle={styles.body}>
        <span aria-hidden="true" {...stylex.props(styles.art)}>
          {icon}
        </span>
        <VStack gap={0.5}>
          <Text xstyle={styles.label}>{label}</Text>
          <Text type="supporting" xstyle={styles.description}>
            {description}
          </Text>
        </VStack>
        {alertLabel ? <span aria-hidden="true" {...stylex.props(styles.dot)} /> : null}
      </HStack>
    </ClickableCard>
    </Press>
  );
}
