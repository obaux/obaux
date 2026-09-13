'use client';

import * as stylex from '@stylexjs/stylex';
import { Carousel } from '@astryxdesign/core/Carousel';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BookmarkIcon } from './icons.js';
import { MaskedItem, MaskedList } from './motion.js';
import { pam } from './tokens.stylex.js';

/**
 * The places a member kept, on the way past.
 *
 * Squares, swiped sideways, three-and-a-bit on screen at a time. A member keeps
 * a handful of places and wants them at a glance from home — not a list to
 * scroll past on the way to everything else. The full list is its own screen,
 * reached from the heading beside this.
 *
 * The bookmark in each corner is the way out, in the same place it was in when
 * the place was saved. Tapping it removes the place and the square leaves under
 * a mask — it wipes away rather than blinking out, so the eye follows what
 * happened instead of noticing that something is missing.
 *
 * The card is a link and the bookmark is a button inside it: two targets, both
 * over 48px, which is why the square is 136px rather than as small as it could
 * be. A card you cannot open is a bookmark with a picture on it.
 *
 * Names are clipped to three lines rather than truncated at one: "Mt. Airy
 * Learning Tree — Germantown Ave" is not a name somebody recognises from its
 * first nine characters.
 */

export interface SavedStripPlace {
  readonly id: string;
  readonly name: string;
  /** Already localised, e.g. "School and training". */
  readonly categoryLabel: string;
  /** Where the card goes. The full list, until a place has its own screen. */
  readonly href: string;
}

export interface SavedStripProps {
  readonly places: readonly SavedStripPlace[];
  /** Names the row for a screen reader, e.g. "Places you saved". */
  readonly label: string;
  /** The bookmark's accessible name, e.g. "Remove from saved". Filled per card. */
  readonly removeLabel: (name: string) => string;
  readonly onRemove: (id: string) => void;
}

const SQUARE = '136px';

const styles = stylex.create({
  region: { width: '100%' },
  card: {
    position: 'relative',
    width: SQUARE,
    height: SQUARE,
    flexShrink: 0,
    borderRadius: '16px',
    backgroundColor: colorVars['--color-background-card'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    overflow: 'hidden',
  },
  link: {
    display: 'block',
    width: '100%',
    height: '100%',
    padding: '12px',
    textDecoration: 'none',
    color: 'inherit',
  },
  name: {
    fontSize: '15px',
    lineHeight: 1.3,
    fontWeight: 600,
    // Three lines, then stop. A name cut mid-word at one line is a name nobody
    // recognises.
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    // Room for the bookmark, which sits over the top-right corner.
    paddingInlineEnd: '28px',
  },
  category: { fontSize: '13px', lineHeight: 1.3 },
  bookmark: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    minHeight: pam.touchTargetMin,
    minWidth: pam.touchTargetMin,
    fontSize: '18px',
    color: colorVars['--color-icon-accent'],
  },
});

export function SavedStrip({ places, label, removeLabel, onRemove }: SavedStripProps) {
  return (
    <section aria-label={label} {...stylex.props(styles.region)}>
      <Carousel gap={2} hasButtons={false} hasEdgeFade>
        {/*
          The mask lives in the motion runtime, which may never arrive — a slow
          connection gets no animation chunk at all. Then this is a plain
          wrapper and a removed square simply goes, which nobody reads as
          broken; the bookmark filling in is what said it worked.
        */}
        <MaskedList>
          {places.map((place) => (
            <MaskedItem key={place.id} className={stylex.props(styles.card).className}>
              <a href={place.href} {...stylex.props(styles.link)}>
                <VStack gap={1}>
                  <Text xstyle={styles.name}>{place.name}</Text>
                  <Text type="supporting" xstyle={styles.category}>
                    {place.categoryLabel}
                  </Text>
                </VStack>
              </a>
              <IconButton
                label={removeLabel(place.name)}
                icon={<BookmarkIcon isFilled />}
                variant="ghost"
                onClick={() => onRemove(place.id)}
                xstyle={styles.bookmark}
              />
            </MaskedItem>
          ))}
        </MaskedList>
      </Carousel>
    </section>
  );
}
