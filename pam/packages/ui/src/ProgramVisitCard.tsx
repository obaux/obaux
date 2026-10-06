import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { MeIcon, PlusIcon } from './icons.js';
import { ToneGround, type Tone } from './Tone.js';

/**
 * A program, as one card (D-332, Will, 6 October): its picture in its
 * category's colour, its name, and what this card is about.
 *
 * - `visit`: the visit being booked, with the day and time under the name
 *   (Plan a visit's Check step).
 * - `invite`: you and an empty "+" beside the picture, and no date (Bring a
 *   friend's Go together): "you two, at this place".
 *
 * The card takes the category's pale shade, so a school program reads blue
 * before a word is read; "you" takes its deep shade.
 */
export interface ProgramVisitCardProps {
  readonly name: string;
  /** The category's colour; null keeps the card white and "you" green. */
  readonly tone: Tone | null;
  /** The category's icon, drawn into the picture. */
  readonly art: ReactNode;
  /** Under the name: the day and time, a service. None for `invite`. */
  readonly lines?: readonly string[];
  readonly variant?: 'visit' | 'invite';
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

const deep = stylex.create({
  blue: { backgroundColor: colorVars['--color-icon-blue'] },
  green: { backgroundColor: colorVars['--color-icon-green'] },
  purple: { backgroundColor: colorVars['--color-icon-purple'] },
  orange: { backgroundColor: colorVars['--color-icon-orange'] },
  red: { backgroundColor: colorVars['--color-icon-red'] },
  teal: { backgroundColor: colorVars['--color-icon-teal'] },
  pink: { backgroundColor: colorVars['--color-icon-pink'] },
  cyan: { backgroundColor: colorVars['--color-icon-cyan'] },
  gray: { backgroundColor: colorVars['--color-icon-gray'] },
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

const FACE = { width: 22, height: 22, 'aria-hidden': true } as const;

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
  // You and the friend, overlapping the picture's right edge.
  faces: { flexShrink: 0, marginInlineStart: '-14px' },
  face: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-background-card'],
  },
  you: { backgroundColor: colorVars['--color-accent'], color: colorVars['--color-on-accent'] },
  friend: {
    marginInlineStart: '-12px',
    backgroundColor: colorVars['--color-background-card'],
    color: colorVars['--color-icon-secondary'],
  },
  words: { minWidth: 0, flexGrow: 1 },
  name: { fontSize: '20px', lineHeight: 1.25, fontWeight: 700 },
  line: { fontSize: '17px', lineHeight: 1.4 },
});

export function ProgramVisitCard({ name, tone, art, lines = [], variant = 'visit' }: ProgramVisitCardProps) {
  const isInvite = variant === 'invite';
  return (
    <VStack gap={4} xstyle={[styles.card, tone ? pale[tone] : null]}>
      <HStack gap={4} align="center" wrap="nowrap">
        <HStack align="center" justify="center" xstyle={[styles.art, tone ? ink[tone] : null]} aria-hidden>
          <ToneGround tone={tone} />
          {art}
        </HStack>
        {isInvite ? (
          <HStack xstyle={styles.faces} aria-hidden>
            <HStack align="center" justify="center" xstyle={[styles.face, styles.you, tone ? deep[tone] : null]}>
              <MeIcon {...FACE} />
            </HStack>
            <HStack align="center" justify="center" xstyle={[styles.face, styles.friend]}>
              <PlusIcon {...FACE} />
            </HStack>
          </HStack>
        ) : (
          <VStack xstyle={styles.words}>
            <Text xstyle={styles.name}>{name}</Text>
          </VStack>
        )}
      </HStack>
      {isInvite ? <Text xstyle={styles.name}>{name}</Text> : null}
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
