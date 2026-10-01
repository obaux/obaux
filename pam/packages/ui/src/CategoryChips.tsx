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
 * Each chip is a 48px toggle (the §2.5 floor; Places' 40px exception,
 * D-104, is not carried over — these are the screen's main filter now).
 */
export interface CategoryChip<K extends string> {
  readonly key: K;
  readonly label: string;
  readonly icon: ReactNode;
}

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
  chip: {
    flexShrink: 0,
    minHeight: '48px',
    borderRadius: '999px',
    paddingInline: '18px',
    fontSize: '16px',
    gap: '8px',
    scrollSnapAlign: 'start',
    backgroundColor: colorVars['--color-background-body'],
    color: colorVars['--color-text-primary'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    boxShadow: '0 2px 8px light-dark(oklch(0 0 0 / 8%), oklch(0 0 0 / 40%))',
  },
  chipOn: {
    borderWidth: '2px',
    borderColor: colorVars['--color-text-primary'],
    fontWeight: 600,
  },
  icon: { width: '22px', height: '22px', flexShrink: 0 },
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
            icon={<HStack xstyle={styles.icon}>{chip.icon}</HStack>}
            onClick={() => onChange(chip.key)}
            xstyle={[styles.chip, on && styles.chipOn]}
          />
        );
      })}
    </HStack>
  );
}
