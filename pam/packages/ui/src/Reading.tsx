'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CheckIcon, CrossIcon } from './icons.js';
import { pam } from './tokens.stylex.js';

/**
 * Pieces for reading something long and important (Will, 9 October, D-416,
 * D-417): the rules about who can see what, the privacy policy, the terms.
 * People who are new to Pam, and may not read easily, are asked to take in a
 * lot; these are what make it quick to scan.
 *
 * Icons lead each heading and each row (Will chose the icon look over a plain
 * one, D-417). Meaning never rests on the picture or the colour alone (§12):
 * every row says it in words, and every icon is `aria-hidden`.
 */
const styles = stylex.create({
  // The round tile an icon sits in: Pam's pale green, the icon in the accent.
  tile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: pam['--pam-secondary-fill'],
    color: colorVars['--color-icon-accent'],
    fontSize: '24px',
  },
  tileSmall: { width: '32px', height: '32px', fontSize: '18px' },
  tileNo: { backgroundColor: colorVars['--color-background-muted'], color: colorVars['--color-text-primary'] },
  // A grey tile and a red one, for the actions at the foot of a screen (Will,
  // D-417): grey for something ordinary, red for something that cannot be undone.
  tileGrey: { backgroundColor: colorVars['--color-background-muted'], color: colorVars['--color-text-secondary'] },
  tileRed: { backgroundColor: colorVars['--color-background-red'], color: colorVars['--color-icon-red'] },
  title: { fontSize: '21px', lineHeight: 1.3 },
  titleBox: { flexGrow: 1, minWidth: 0 },
  groupTitle: { fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  list: { width: '100%', listStyle: 'none', paddingInline: 0, marginBlock: 0 },
  row: { width: '100%', paddingBlock: '8px' },
  lead: { fontSize: '18px', lineHeight: 1.45, fontWeight: 600 },
  // The short version's lines read like "Read the full privacy policy" under
  // them (Will, D-417): the link's size and a regular weight, not the heavier
  // 18px of the rows below.
  summaryText: { fontSize: pam['--pam-link-size'], lineHeight: 1.45, fontWeight: 400 },
  // No shadow: this card sits flat on the page.
  flat: { boxShadow: 'none' },
  detail: { fontSize: '16px', lineHeight: 1.45, fontWeight: 400 },
  // The guide: smaller than the cards (Will, D-417), icon beside the title.
  guide: { backgroundColor: pam['--pam-secondary-fill'] },
  guideTitle: { fontSize: '18px', lineHeight: 1.3 },
  guideIcon: { display: 'flex', flexShrink: 0, color: colorVars['--color-icon-accent'], fontSize: '24px' },
  guideBody: { fontSize: '16px', lineHeight: 1.5 },
  // A section heading with a bare icon: no tile, no card.
  sectionIcon: { display: 'flex', flexShrink: 0, color: colorVars['--color-icon-accent'], fontSize: '26px' },
});

/** A round tile holding an icon. Decorative. */
export function IconTile(props: { children: ReactNode; small?: boolean; tone?: 'grey' | 'red' }) {
  return <Tile {...props} />;
}

function Tile({
  children,
  small = false,
  no = false,
  tone,
}: {
  children: ReactNode;
  small?: boolean;
  no?: boolean;
  tone?: 'grey' | 'red';
}) {
  return (
    <HStack
      xstyle={[
        styles.tile,
        small ? styles.tileSmall : null,
        no ? styles.tileNo : null,
        tone === 'grey' ? styles.tileGrey : null,
        tone === 'red' ? styles.tileRed : null,
      ]}
      aria-hidden="true"
    >
      {children}
    </HStack>
  );
}

/** A titled card, an icon in a tile leading its title. */
export interface ReadCardProps {
  readonly title: string;
  readonly icon?: ReactNode;
  readonly headingLevel?: 2 | 3;
  readonly children: ReactNode;
}

export function ReadCard({ title, icon, headingLevel = 2, children }: ReadCardProps) {
  return (
    <Card padding={4}>
      <VStack gap={3}>
        <HStack gap={2} align="center" wrap="nowrap">
          {icon ? <Tile>{icon}</Tile> : null}
          <Heading level={headingLevel} xstyle={[styles.title, styles.titleBox]}>
            {title}
          </Heading>
        </HStack>
        {children}
      </VStack>
    </Card>
  );
}

/**
 * Who "your guide" is, said once at the top (D-416): the person who invited
 * you, or a staff member responsible for guiding you. Everything below can
 * then say "your guide". Small (D-417): the icon sits beside the title and the
 * sentence runs full width underneath, with 20px of padding all round (Will,
 * D-417: "more padding on this card").
 */
export interface GuideCardProps {
  readonly title: string;
  readonly body: string;
  readonly icon?: ReactNode;
}

export function GuideCard({ title, body, icon }: GuideCardProps) {
  return (
    <Card padding={5} xstyle={styles.guide}>
      <VStack gap={2}>
        <HStack gap={2} align="center" wrap="nowrap">
          {icon ? (
            <HStack xstyle={styles.guideIcon} aria-hidden="true">
              {icon}
            </HStack>
          ) : null}
          <Heading level={2} xstyle={styles.guideTitle}>
            {title}
          </Heading>
        </HStack>
        <Text xstyle={styles.guideBody}>{body}</Text>
      </VStack>
    </Card>
  );
}

/** A section's heading with a bare icon beside it — for flat pages with no cards. */
export function SectionHeading({
  title,
  icon,
  level = 2,
}: {
  readonly title: string;
  readonly icon?: ReactNode;
  readonly level?: 2 | 3;
}) {
  return (
    <HStack gap={2} align="center" wrap="nowrap">
      {icon ? (
        <HStack xstyle={styles.sectionIcon} aria-hidden="true">
          {icon}
        </HStack>
      ) : null}
      <Heading level={level} xstyle={styles.title}>
        {title}
      </Heading>
    </HStack>
  );
}

/** One row: a tick or a cross, a short lead, and a grey line under it when there is more to say. */
export interface FactRowProps {
  readonly lead: string;
  readonly detail?: string | undefined;
  /** `yes` draws a tick, `no` a cross. */
  readonly mark: 'yes' | 'no';
}

export function FactRow({ lead, detail, mark }: FactRowProps) {
  return (
    <HStack gap={3} align="start" wrap="nowrap" role="listitem" xstyle={styles.row}>
      <Tile small no={mark === 'no'}>
        {mark === 'yes' ? <CheckIcon /> : <CrossIcon />}
      </Tile>
      {/*
        One element, so the sentence is one piece of text — read aloud, found by
        search, and equal to the contract's line — with the second sentence drawn
        on its own line in grey (D-417).
      */}
      <Text xstyle={styles.lead}>
        {lead}
        {detail ? (
          <>
            {' '}
            <Text display="block" type="supporting" xstyle={styles.detail}>
              {detail}
            </Text>
          </>
        ) : null}
      </Text>
    </HStack>
  );
}

/** A small heading over a few rows. Three to four rows is what a group holds. */
export function FactGroup({ title, children }: { readonly title?: string; readonly children: ReactNode }) {
  return (
    <VStack gap={1}>
      {title ? (
        <Heading level={3} xstyle={styles.groupTitle}>
          {title}
        </Heading>
      ) : null}
      <VStack gap={0} role="list" xstyle={styles.list}>
        {children}
      </VStack>
    </VStack>
  );
}

/**
 * The short version, first (D-416): a few lines, each a true summary of the
 * detail below, for the person who reads one thing and moves on.
 */
export interface SummaryLine {
  readonly text: string;
  readonly mark: 'yes' | 'no' | 'call';
  readonly icon?: ReactNode;
}

export function SummaryCard({ title, lines }: { readonly title: string; readonly lines: readonly SummaryLine[] }) {
  return (
    <Card padding={4} xstyle={styles.flat}>
      <VStack gap={2}>
        <Heading level={2} xstyle={styles.title}>
          {title}
        </Heading>
        <VStack gap={0} role="list" xstyle={styles.list}>
          {lines.map((line) => (
            <HStack key={line.text} gap={3} align="start" wrap="nowrap" role="listitem" xstyle={styles.row}>
              <Tile small no={line.mark === 'no'}>
                {line.icon ?? (line.mark === 'no' ? <CrossIcon /> : <CheckIcon />)}
              </Tile>
              <Text xstyle={styles.summaryText}>{line.text}</Text>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </Card>
  );
}
