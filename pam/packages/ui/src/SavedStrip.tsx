'use client';

import * as stylex from '@stylexjs/stylex';
import { Carousel } from '@astryxdesign/core/Carousel';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BookmarkIcon } from './icons.js';
import { MaskedItem, MaskedList } from './motion.js';
import { pam } from './tokens.stylex.js';

/**
 * The places a member kept, on the way past.
 *
 * Squares, swiped sideways, one and a half on screen at a time (Will, 14
 * September). The half is the affordance: a card cut by the edge of the screen
 * is the only thing that says "there are more of these" without a control
 * saying it. A member keeps a handful of places and wants them at a glance from
 * home — not a list to scroll past on the way to everything else.
 *
 * The row runs to the edge of the screen rather than stopping at the page's
 * gutter, and fades out there rather than being chopped. Both matter: a strip
 * that stops short of the edge looks like it ended, and a hard cut looks like a
 * rendering fault. The negative margin is what lets it out of the page's
 * padding, and the mask is what makes the edge soft — deliberately not
 * `overflow: hidden`, which would clip the cards' own shadows.
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
  /** Where the card goes — that place's own screen, with `?from=home` so its back link returns here. */
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

const styles = stylex.create({
  region: {
    // Out of the page's 16px gutter on both sides, so the row reaches the
    // screen. The container itself never clips: the fade below does that work.
    width: 'calc(100% + 32px)',
    marginInline: '-16px',
    // Named as a container so a card can be sized against the row.
    containerType: 'inline-size',
    // The soft end: opaque until the last 48px, then gone by the edge. A mask
    // rather than a gradient overlay, so it works on whatever the page colour
    // happens to be in either mode.
    maskImage: 'linear-gradient(to right, black calc(100% - 48px), transparent)',
  },
  /** Puts the first card back where the page's own content starts. */
  track: { paddingInline: '16px' },
  card: {
    position: 'relative',
    /*
     * One and a half cards in view. The row is the screen minus its gutters, so
     * two-thirds of it puts the second card's edge in sight and the third out
     * of it — capped, so this stays a strip of cards on a tablet rather than
     * two enormous tiles.
     */
    width: 'min(62cqw, 220px)',
    /*
     * The gap between cards. `Carousel gap` cannot draw it: the masked list
     * is one React child, so the carousel sees one slide holding every card
     * flush against the next (Will's screenshot, 21 September). The same
     * spacing token, on the card itself.
     */
    marginInlineEnd: spacingVars['--spacing-2'],
    /*
     * Wide rather than square. At one and a half per view a card is ~230px
     * across, and a square that size is mostly empty — a name, a category and
     * a bookmark do not fill it, and the empty half reads as something that
     * failed to load. 132px is the height those three things actually need.
     */
    height: '132px',
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
      {/*
        The same 8px between cards that the tiles on the home screen use, so the
        two blocks on that screen are spaced by one rule rather than two.
      */}
      <Carousel gap={2} hasButtons={false} hasEdgeFade={false} xstyle={styles.track}>
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
