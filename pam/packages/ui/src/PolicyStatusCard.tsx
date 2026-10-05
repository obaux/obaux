import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { SignIcon, SignedIcon } from './icons.js';

/**
 * A white card near the top of a place's page that says where the member
 * stands with it (D-271, D-273): an icon in a tinted circle, a bold line and
 * a quieter one, in orange (something to do) or green (done, confirmed).
 *
 * The same two colours as the trip card's token, so a member who saw orange
 * on Trips sees the same orange here and knows it is the same thing.
 *
 * With `href` the whole card opens it and ends in a chevron; without, it is
 * a statement — the booked visit — and nothing about it looks tappable.
 */
export interface StatusCardProps {
  readonly tone: 'orange' | 'green';
  readonly icon: ReactNode;
  readonly title: string;
  readonly body: string;
  readonly href?: string | null;
  /** The card's accessible name, when it is a link. */
  readonly label?: string;
}

const styles = stylex.create({
  card: { width: '100%' },
  mark: {
    width: '44px',
    height: '44px',
    flexShrink: 0,
    borderRadius: '50%',
  },
  markOrange: { backgroundColor: colorVars['--color-background-orange'], color: colorVars['--color-icon-orange'] },
  markGreen: { backgroundColor: colorVars['--color-background-green'], color: colorVars['--color-icon-green'] },
  words: { flexGrow: 1, minWidth: 0 },
  title: { fontSize: '18px', lineHeight: 1.3, fontWeight: 700 },
  titleOrange: { color: colorVars['--color-icon-orange'] },
  titleGreen: { color: colorVars['--color-icon-green'] },
  body: { fontSize: '16px', lineHeight: 1.35 },
  bodyOrange: { color: colorVars['--color-text-orange'] },
  bodyGreen: { color: colorVars['--color-text-green'] },
});

export function StatusCard({ tone, icon, title, body, href = null, label }: StatusCardProps) {
  const isGreen = tone === 'green';
  const content = (
    <HStack gap={3} align="center" wrap="nowrap">
      <HStack align="center" justify="center" xstyle={[styles.mark, isGreen ? styles.markGreen : styles.markOrange]}>
        {icon}
      </HStack>
      <VStack gap={0.5} xstyle={styles.words}>
        <Text xstyle={[styles.title, isGreen ? styles.titleGreen : styles.titleOrange]}>{title}</Text>
        <Text xstyle={[styles.body, isGreen ? styles.bodyGreen : styles.bodyOrange]}>{body}</Text>
      </VStack>
      {href ? <Icon icon="chevronRight" size="md" color="secondary" /> : null}
    </HStack>
  );
  return href ? (
    <ClickableCard label={label ?? `${title}. ${body}`} href={href} padding={4} xstyle={styles.card}>
      {content}
    </ClickableCard>
  ) : (
    <Card padding={4} xstyle={styles.card}>
      {content}
    </Card>
  );
}

/** Where a program's policies stand (D-271): orange to sign, green once signed. */
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

export function PolicyStatusCard({ title, body, href, label, isDone }: PolicyStatusCardProps) {
  return (
    <StatusCard
      tone={isDone ? 'green' : 'orange'}
      icon={isDone ? <SignedIcon {...ICON} /> : <SignIcon {...ICON} />}
      title={title}
      body={body}
      href={href}
      label={label}
    />
  );
}
