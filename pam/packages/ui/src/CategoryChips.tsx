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
  row: {
    overflowX: 'auto',
    scrollbarWidth: 'none',
    marginInline: '-4px',
    paddingInline: '4px',
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
            icon={<HStack xstyle={[styles.icon, chip.tone && tones[chip.tone]]}>{chip.icon}</HStack>}
            onClick={() => onChange(chip.key)}
            xstyle={[styles.chip, on && styles.chipOn]}
          />
        );
      })}
    </HStack>
  );
}
