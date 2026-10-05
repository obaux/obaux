import * as stylex from '@stylexjs/stylex';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { SignIcon, SignedIcon } from './icons.js';

/**
 * Where a program's policies stand, near the top of a place's page (D-271,
 * Will, 5 October): "a white card that sits under program name and time,
 * and has the orange color used in [the] chip from [the] trip card … on icon
 * and text", and a green one once everything is signed.
 *
 * The same two colours as the trip card's token ("Signatures needed",
 * "Policies signed"), so a member who saw orange on Trips sees the same
 * orange here and knows it is the same thing. The whole card opens the
 * policies.
 */
export interface PolicyStatusCardProps {
  /** "Policies to sign" / "Policies signed". */
  readonly title: string;
  /** "Sign before your visit" / "All signatures complete". */
  readonly body: string;
  readonly href: string;
  /** The card's accessible name. */
  readonly label: string;
  readonly isDone: boolean;
}

const ICON = { width: 24, height: 24, 'aria-hidden': true } as const;

const styles = stylex.create({
  card: { width: '100%' },
  mark: {
    width: '44px',
    height: '44px',
    flexShrink: 0,
    borderRadius: '50%',
  },
  markToDo: { backgroundColor: colorVars['--color-background-orange'], color: colorVars['--color-icon-orange'] },
  markDone: { backgroundColor: colorVars['--color-background-green'], color: colorVars['--color-icon-green'] },
  words: { flexGrow: 1, minWidth: 0 },
  title: { fontSize: '18px', lineHeight: 1.3, fontWeight: 700 },
  titleToDo: { color: colorVars['--color-icon-orange'] },
  titleDone: { color: colorVars['--color-icon-green'] },
  body: { fontSize: '16px', lineHeight: 1.35 },
  bodyToDo: { color: colorVars['--color-text-orange'] },
  bodyDone: { color: colorVars['--color-text-green'] },
});

export function PolicyStatusCard({ title, body, href, label, isDone }: PolicyStatusCardProps) {
  return (
    <ClickableCard label={label} href={href} padding={4} xstyle={styles.card}>
      <HStack gap={3} align="center" wrap="nowrap">
        <HStack align="center" justify="center" xstyle={[styles.mark, isDone ? styles.markDone : styles.markToDo]}>
          {isDone ? <SignedIcon {...ICON} /> : <SignIcon {...ICON} />}
        </HStack>
        <VStack gap={0.5} xstyle={styles.words}>
          <Text xstyle={[styles.title, isDone ? styles.titleDone : styles.titleToDo]}>{title}</Text>
          <Text xstyle={[styles.body, isDone ? styles.bodyDone : styles.bodyToDo]}>{body}</Text>
        </VStack>
        <Icon icon="chevronRight" size="md" color="secondary" />
      </HStack>
    </ClickableCard>
  );
}
