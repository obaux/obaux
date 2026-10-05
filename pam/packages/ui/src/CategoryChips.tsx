'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * A row of rounded chips under the search bar, one per kind of place (D-212).
 *
 * The reference's "All / Homes / Experiences / Services" row, carrying PAM's
 * own three categories (§2.5) and All. One chip is always chosen. The row
 * scrolls sideways when it does not fit — at 320px, and in Spanish, where
 * the words are longer — with the edge of the next chip showing, so it is
 * plain there is more.
 *
 * Each chip is a 40px pill with a 48px tap area (D-265; the §2.5 floor; Places' 40px exception,
 * D-104, is not carried over — these are the screen's main filter now).
 */
export interface CategoryChip<K extends string> {
  readonly key: K;
  readonly label: string;
  readonly icon: ReactNode;
  /**
   * The category's colour — the same one as its badge on a place
   * (`CATEGORY_DEFINITIONS[…].colorToken`). The icon takes it so each chip
   * stands out a little (Will, 3 October); the words stay in text colour.
   * "All" has none.
   */
  readonly tone?: ChipTone;
}

export type ChipTone = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'pink' | 'cyan' | 'gray';

export interface CategoryChipsProps<K extends string> {
  readonly chips: readonly CategoryChip<K>[];
  readonly value: K;
  readonly onChange: (key: K) => void;
  /** The group's name, read out — "Kinds of places". */
  readonly label: string;
}

const styles = stylex.create({
  // Starts in line with the search bar and stops at the same edge (Will,
  // 1 October: the first version bled to the screen edges and crept off
  // them). A few pixels of room each side and below for the shadow.
  // Will, 5 October (D-267): "set the chip overflow to visible, so they
  // don't get clipped". A scrolling row has to clip somewhere, so it now
  // clips at the screen's own right edge: the row runs past the page's 16px
  // gutter on that side, and its start stays in line with the search bar.
  row: {
    overflowX: 'auto',
    scrollbarWidth: 'none',
    marginInlineStart: '-4px',
    marginInlineEnd: '-16px',
    paddingInlineStart: '4px',
    paddingInlineEnd: '16px',
    paddingBlock: '6px 10px',
    scrollSnapType: 'x proximity',
  },
  // Smaller to the eye, after the reference (Will, 5 October, D-265): 40px
  // tall, 15px words, a lighter lift. The 48px a finger needs (§2.5) is kept
  // by an invisible margin around each chip (::before), not by its outline.
  chip: {
    position: 'relative',
    flexShrink: 0,
    minHeight: '40px',
    borderRadius: '999px',
    paddingInline: '14px',
    fontSize: '15px',
    gap: '6px',
    scrollSnapAlign: 'start',
    backgroundColor: colorVars['--color-background-body'],
    color: colorVars['--color-text-primary'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    boxShadow: '0 1px 4px light-dark(oklch(0 0 0 / 7%), oklch(0 0 0 / 35%))',
    '::before': { content: "''", position: 'absolute', insetBlock: '-4px', insetInline: '-2px' },
  },
  chipOn: {
    borderWidth: '2px',
    borderColor: colorVars['--color-text-primary'],
    fontWeight: 600,
  },
  icon: { width: '18px', height: '18px', flexShrink: 0 },
  // A soft pop of the category's colour behind its icon (Will, 5 October,
  // D-288: "a circle with blur so it looks like icons pop a bit more").
  // Its own stacking context, so the glow sits behind the icon and never
  // behind the chip's white face.
  iconWrap: { position: 'relative', isolation: 'isolate' },
  glow: {
    position: 'absolute',
    width: '24px',
    height: '24px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    filter: 'blur(5px)',
    opacity: 0.6,
    zIndex: -1,
    pointerEvents: 'none',
  },
});

// The bright data shade of each tone — the icon itself stays the deep one,
// so it still reads on the glow.
const glows = stylex.create({
  blue: { backgroundColor: 'var(--color-data-blue-3)' },
  green: { backgroundColor: 'var(--color-data-shamrock-3)' },
  purple: { backgroundColor: 'var(--color-data-purple-3)' },
  orange: { backgroundColor: 'var(--color-data-orange-3)' },
  red: { backgroundColor: 'var(--color-data-red-3)' },
  teal: { backgroundColor: 'var(--color-data-teal-3)' },
  pink: { backgroundColor: 'var(--color-data-pink-3)' },
  cyan: { backgroundColor: 'var(--color-data-teal-3)' },
  gray: { backgroundColor: 'var(--color-data-gray-3)' },
});

const tones = stylex.create({
  blue: { color: colorVars['--color-icon-blue'] },
  green: { color: colorVars['--color-icon-green'] },
  purple: { color: colorVars['--color-icon-purple'] },
  orange: { color: colorVars['--color-icon-orange'] },
  red: { color: colorVars['--color-icon-red'] },
  teal: { color: colorVars['--color-icon-teal'] },
  pink: { color: colorVars['--color-icon-pink'] },
  cyan: { color: colorVars['--color-icon-cyan'] },
  gray: { color: colorVars['--color-icon-gray'] },
});

export function CategoryChips<K extends string>({ chips, value, onChange, label }: CategoryChipsProps<K>) {
  return (
    <HStack gap={2} wrap="nowrap" role="group" aria-label={label} xstyle={styles.row}>
      {chips.map((chip) => {
        const on = chip.key === value;
        return (
          <Button
            key={chip.key}
            label={chip.label}
            variant="secondary"
            aria-pressed={on}
            icon={
              <HStack xstyle={[styles.icon, styles.iconWrap, chip.tone && tones[chip.tone]]}>
                {chip.tone ? <HStack aria-hidden xstyle={[styles.glow, glows[chip.tone]]} /> : null}
                {chip.icon}
              </HStack>
            }
            onClick={() => onChange(chip.key)}
            xstyle={[styles.chip, on && styles.chipOn]}
          />
        );
      })}
    </HStack>
  );
}
