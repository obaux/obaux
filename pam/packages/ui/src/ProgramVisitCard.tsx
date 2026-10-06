import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { ToneGround, type Tone } from './Tone.js';

/**
 * A program, as one card (D-332, Will, 6 October): its picture in its
 * category's colour, its name, and the visit under it: the service, the day
 * and time. On Plan a visit's Check step and the booked screen (D-333).
 *
 * The card takes the category's pale shade, so a school program reads blue
 * before a word is read.
 */
export interface ProgramVisitCardProps {
  readonly name: string;
  /** The category's colour; null keeps the card white. */
  readonly tone: Tone | null;
  /** The category's icon, drawn into the picture. */
  readonly art: ReactNode;
  /** Under the name: the service, the day and time. */
  readonly lines?: readonly string[];
}

const pale = stylex.create({
  blue: { backgroundColor: 'var(--color-data-blue-1)' },
  green: { backgroundColor: 'var(--color-data-shamrock-1)' },
  purple: { backgroundColor: 'var(--color-data-purple-1)' },
  orange: { backgroundColor: 'var(--color-data-orange-1)' },
  red: { backgroundColor: 'var(--color-data-red-1)' },
  teal: { backgroundColor: 'var(--color-data-teal-1)' },
  pink: { backgroundColor: 'var(--color-data-pink-1)' },
  cyan: { backgroundColor: 'var(--color-data-teal-1)' },
  gray: { backgroundColor: 'var(--color-data-gray-1)' },
});

// The picture's ink: a plain icon takes the category's deep shade too.
const ink = stylex.create({
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

const styles = stylex.create({
  card: {
    width: '100%',
    padding: '20px',
    borderRadius: '24px',
    backgroundColor: colorVars['--color-background-card'],
  },
  art: {
    width: '72px',
    height: '72px',
    flexShrink: 0,
    borderRadius: '18px',
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
    color: colorVars['--color-icon-accent'],
    // White behind the shards, so the picture holds its own on the tint.
    backgroundColor: colorVars['--color-background-card'],
    boxShadow: '0 0 0 3px var(--color-background-card)',
  },
  words: { minWidth: 0, flexGrow: 1 },
  name: { fontSize: '20px', lineHeight: 1.25, fontWeight: 700 },
  line: { fontSize: '17px', lineHeight: 1.4 },
});

export function ProgramVisitCard({ name, tone, art, lines = [] }: ProgramVisitCardProps) {
  return (
    <VStack gap={4} xstyle={[styles.card, tone ? pale[tone] : null]}>
      <HStack gap={4} align="center" wrap="nowrap">
        <HStack align="center" justify="center" xstyle={[styles.art, tone ? ink[tone] : null]} aria-hidden>
          <ToneGround tone={tone} />
          {art}
        </HStack>
        <VStack xstyle={styles.words}>
          <Text xstyle={styles.name}>{name}</Text>
        </VStack>
      </HStack>
      {lines.length > 0 ? (
        <VStack gap={1}>
          {lines.map((line) => (
            <Text key={line} xstyle={styles.line}>
              {line}
            </Text>
          ))}
        </VStack>
      ) : null}
    </VStack>
  );
}
