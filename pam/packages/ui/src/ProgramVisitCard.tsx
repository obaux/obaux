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
 * White, lifted off the page by a layered shadow (D-334, Will, 7 October:
 * "revert component back to white, and add realistic shadows so it pops"),
 * with the day and time under the name, beside the picture. The picture
 * keeps the category's colour.
 */
export interface ProgramVisitCardProps {
  readonly name: string;
  /** The category's colour, for the picture. */
  readonly tone: Tone | null;
  /** The category's icon, drawn into the picture. */
  readonly art: ReactNode;
  /** Under the name: the service, the day and time. */
  readonly lines?: readonly string[];
  /** Under those, how soon: "Today", "Tomorrow", "In 13 days" (D-336). */
  readonly countdown?: string | null;
}

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
    // Several soft layers, as light falls on paper: a tight contact shadow,
    // then wider, fainter ones. Deeper in dark mode, like the theme's own.
    boxShadow:
      '0 1px 2px light-dark(oklch(0 0 0 / 6%), oklch(0 0 0 / 30%)), 0 4px 8px light-dark(oklch(0 0 0 / 6%), oklch(0 0 0 / 30%)), 0 12px 24px light-dark(oklch(0 0 0 / 8%), oklch(0 0 0 / 40%)), 0 24px 48px light-dark(oklch(0 0 0 / 6%), oklch(0 0 0 / 30%)), inset 0 0 0 1px light-dark(transparent, oklch(1 0 0 / 8%))',
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
    backgroundColor: colorVars['--color-background-card'],
  },
  words: { minWidth: 0, flexGrow: 1 },
  name: { fontSize: '20px', lineHeight: 1.25, fontWeight: 700 },
  // Smaller than the name, so the name leads (Will, D-336).
  line: { fontSize: '15px', lineHeight: 1.35, color: colorVars['--color-text-secondary'] },
  countdown: { fontSize: '15px', lineHeight: 1.35, fontWeight: 600, color: colorVars['--color-text-accent'] },
});

export function ProgramVisitCard({ name, tone, art, lines = [], countdown = null }: ProgramVisitCardProps) {
  return (
    <HStack gap={4} align="center" wrap="nowrap" xstyle={styles.card}>
      <HStack align="center" justify="center" xstyle={[styles.art, tone ? ink[tone] : null]} aria-hidden>
        <ToneGround tone={tone} />
        {art}
      </HStack>
      {/* The name, then the service and the day and time under it. */}
      <VStack gap={1} xstyle={styles.words}>
        <Text xstyle={styles.name}>{name}</Text>
        {lines.map((line) => (
          <Text key={line} xstyle={styles.line}>
            {line}
          </Text>
        ))}
        {countdown ? <Text xstyle={styles.countdown}>{countdown}</Text> : null}
      </VStack>
    </HStack>
  );
}
