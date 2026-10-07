import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VisitTag } from './VisitTag.js';

/**
 * Saved places as a two-by-two grid (D-213, from the reference Will gave on
 * 1 October): a square picture, the place's name under it, and one quiet
 * line. The picture is a placeholder for now — the place's category, drawn
 * large on a soft ground — until places have photos.
 *
 * Each tile is one link to the place; two to a row at every phone width.
 *
 * **Editing** (Will's second reference): the screen's Edit button puts a
 * round × on every picture; tapping it unsaves that place. While editing,
 * tiles are not links — a tap meant for the × never opens the place.
 */
export interface SavedTile {
  readonly id: string;
  readonly name: string;
  /** "School and training", or a distance. */
  readonly subtitle?: string | null;
  readonly href: string;
  /** The picture: the category's illustration, `size="fill"` (D-337). */
  readonly art: ReactNode;
  /**
   * A booked visit, "Oct 7 · 10:00 AM" (D-292): a small white chip in the
   * picture's top corner (Will, D-296: "chips should be white and subtle"),
   * so the saved place says when you are going. Left out with no visit.
   */
  readonly tag?: string | null;
  /** The tile's spoken name when it has a tag — "Example Learning Center. Your visit: …". */
  readonly label?: string;
}

const styles = stylex.create({
  grid: { width: '100%', rowGap: '24px', columnGap: '14px' },
  tile: { flexBasis: 'calc(50% - 7px)', flexGrow: 0, flexShrink: 0, minWidth: 0 },
  square: {
    aspectRatio: '1 / 1',
    width: '100%',
    color: colorVars['--color-icon-accent'],
    // White, so the category's coloured icon and its glow carry the
    // picture (Will, D-292) — grey made every tile look like a placeholder.
    backgroundColor: colorVars['--color-background-card'],
    fontSize: '48px',
    position: 'relative',
    isolation: 'isolate',
    // The picture is decoration over the card's own link: taps go through
    // to the link (positioning it for the tag had put it on top).
    pointerEvents: 'none',
  },
  name: {
    fontSize: '17px',
    lineHeight: 1.3,
    fontWeight: 600,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  subtitle: { fontSize: '15px' },
  words: { paddingInline: '2px' },
  // The link around a tile clips by default, which cut the picture's shadow
  // off where the name begins (Will, 3 October). Nothing in it needs clipping.
  link: { overflow: 'visible' },
  frame: { position: 'relative' },
  remove: {
    position: 'absolute',
    top: '8px',
    insetInlineStart: '8px',
    zIndex: 1,
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: colorVars['--color-background-body'],
    boxShadow: '0 1px 4px oklch(0 0 0 / 18%)',
  },
});

export interface SavedGridProps {
  readonly tiles: readonly SavedTile[];
  /** The list's name, read out — "Places you saved". */
  readonly label: string;
  readonly isEditing?: boolean;
  readonly onRemove?: (id: string) => void;
  /** The × button's name for a place — "Unsave Example Learning Center". */
  readonly removeLabel?: (name: string) => string;
}

export function SavedGrid({ tiles, label, isEditing = false, onRemove, removeLabel }: SavedGridProps) {
  return (
    <HStack wrap="wrap" align="start" xstyle={styles.grid} role="list" aria-label={label}>
      {tiles.map((tile) => {
        const body = (
          <VStack gap={2}>
            <Card padding={0} xstyle={styles.square}>
              <HStack align="center" justify="center" xstyle={styles.square}>
                {tile.art}
                {tile.tag ? <VisitTag label={tile.tag} isOverlay /> : null}
              </HStack>
            </Card>
            <VStack gap={0.5} xstyle={styles.words}>
              <Text xstyle={styles.name}>{tile.name}</Text>
              {tile.subtitle ? (
                <Text type="supporting" xstyle={styles.subtitle}>
                  {tile.subtitle}
                </Text>
              ) : null}
            </VStack>
          </VStack>
        );
        return (
          <VStack key={tile.id} xstyle={[styles.tile, styles.frame]} role="listitem">
            {isEditing ? (
              <>
                <IconButton
                  label={removeLabel ? removeLabel(tile.name) : tile.name}
                  icon={<Icon icon="close" size="md" />}
                  variant="ghost"
                  onClick={() => onRemove?.(tile.id)}
                  xstyle={styles.remove}
                />
                {body}
              </>
            ) : (
              <ClickableCard label={tile.label ?? tile.name} href={tile.href} variant="transparent" padding={0} xstyle={styles.link}>
                {body}
              </ClickableCard>
            )}
          </VStack>
        );
      })}
    </HStack>
  );
}
