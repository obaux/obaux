'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CopyButton, type CopyButtonProps } from './CopyButton.js';
import { CheckIcon, CrossIcon } from './icons.js';
import { pam } from './tokens.stylex.js';

/**
 * Cards for reading something long and important (Will, 9 October, D-416): the
 * rules about who can see what, the privacy policy, the terms. People who are
 * new to Pam, and may not read easily, are asked to take in a lot; these are
 * the pieces that make it quick to scan.
 *
 * Two looks, chosen by `decor`, so the same content can be judged both ways:
 *
 * - **`icons`** — a small round icon on each card and a tick or a cross on
 *   each row. Quicker to scan for most people; one more thing to look at.
 * - **`plain`** — words only: a coloured edge instead of an icon, a hairline
 *   between rows. Nothing is drawn.
 *
 * Whichever is chosen, meaning never rests on the picture or the colour alone
 * (§12): every row says it in words, and every icon is `aria-hidden`.
 */
export type Decor = 'icons' | 'plain';

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
  title: { fontSize: '21px', lineHeight: 1.3 },
  titleBox: { flexGrow: 1, minWidth: 0 },
  groupTitle: { fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  list: { width: '100%', listStyle: 'none', paddingInline: 0, marginBlock: 0 },
  row: { width: '100%' },
  // Plain rows: a hairline above each but the first.
  rowRule: {
    paddingBlock: '12px',
    borderBlockStartWidth: { default: '1px', ':first-child': '0px' },
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: colorVars['--color-border'],
  },
  rowIcons: { paddingBlock: '8px' },
  lead: { fontSize: '18px', lineHeight: 1.45, fontWeight: 600 },
  leadPlain: { fontSize: '18px', lineHeight: 1.45 },
  detail: { fontSize: '16px', lineHeight: 1.45 },
  body: { fontSize: '18px', lineHeight: 1.55 },
  // Plain cards say what they are with a bar down the leading edge.
  edge: {
    borderInlineStartWidth: '4px',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: colorVars['--color-icon-accent'],
  },
  edgeNo: { borderInlineStartColor: colorVars['--color-border'] },
  tinted: { backgroundColor: pam['--pam-secondary-fill'] },
});

/** A round tile holding an icon. Decorative. */
function Tile({ children, small = false, no = false }: { children: ReactNode; small?: boolean; no?: boolean }) {
  return (
    <HStack xstyle={[styles.tile, small ? styles.tileSmall : null, no ? styles.tileNo : null]} aria-hidden="true">
      {children}
    </HStack>
  );
}

/**
 * A titled card. With `copy`, a copy icon sits top right and puts `copy.text`
 * on the clipboard. With `icon` (and `decor="icons"`), a round icon leads the
 * title.
 */
export interface ReadCardProps {
  readonly title: string;
  readonly decor: Decor;
  readonly icon?: ReactNode;
  readonly copy?: CopyButtonProps;
  readonly id?: string;
  readonly headingLevel?: 2 | 3;
  readonly children: ReactNode;
}

export function ReadCard({ title, decor, icon, copy, id, headingLevel = 2, children }: ReadCardProps) {
  return (
    <Card padding={4} {...(id ? { id } : {})}>
      <VStack gap={3}>
        <HStack gap={2} align="center" wrap="nowrap">
          {decor === 'icons' && icon ? <Tile>{icon}</Tile> : null}
          <Heading level={headingLevel} xstyle={[styles.title, styles.titleBox]}>
            {title}
          </Heading>
          {copy ? <CopyButton {...copy} /> : null}
        </HStack>
        {children}
      </VStack>
    </Card>
  );
}

/**
 * Who "your guide" is, said once at the top (D-416): the person who invited
 * you, or a staff member responsible for guiding you. Everything below can
 * then say "your guide".
 */
export interface GuideCardProps {
  readonly title: string;
  readonly body: string;
  readonly decor: Decor;
  readonly icon?: ReactNode;
}

export function GuideCard({ title, body, decor, icon }: GuideCardProps) {
  return (
    <Card padding={4} xstyle={[styles.tinted, decor === 'plain' ? styles.edge : null]}>
      <HStack gap={3} align="start" wrap="nowrap">
        {decor === 'icons' && icon ? <Tile>{icon}</Tile> : null}
        <VStack gap={1}>
          <Heading level={2} xstyle={styles.title}>
            {title}
          </Heading>
          <Text xstyle={styles.body}>{body}</Text>
        </VStack>
      </HStack>
    </Card>
  );
}

/** One row: a short lead, and a grey line under it when there is more to say. */
export interface FactRowProps {
  readonly lead: string;
  readonly detail?: string | undefined;
  /** `yes` draws a tick, `no` a cross; left out, no mark. Ignored in `plain`. */
  readonly mark?: 'yes' | 'no';
  readonly decor: Decor;
}

export function FactRow({ lead, detail, mark, decor }: FactRowProps) {
  return (
    <HStack
      gap={3}
      align="start"
      wrap="nowrap"
      role="listitem"
      xstyle={[styles.row, decor === 'plain' ? styles.rowRule : styles.rowIcons]}
    >
      {decor === 'icons' && mark ? (
        <Tile small no={mark === 'no'}>
          {mark === 'yes' ? <CheckIcon /> : <CrossIcon />}
        </Tile>
      ) : null}
      <VStack gap={0}>
        <Text xstyle={decor === 'plain' ? styles.leadPlain : styles.lead}>{lead}</Text>
        {detail ? (
          <Text type="supporting" xstyle={styles.detail}>
            {detail}
          </Text>
        ) : null}
      </VStack>
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
 * The short version, first (D-416): three lines, each a true summary of the
 * detail below, for the person who reads one thing and moves on.
 */
export interface SummaryLine {
  readonly text: string;
  readonly mark: 'yes' | 'no' | 'call';
  readonly icon?: ReactNode;
}

export function SummaryCard({
  title,
  lines,
  decor,
}: {
  readonly title: string;
  readonly lines: readonly SummaryLine[];
  readonly decor: Decor;
}) {
  return (
    <Card padding={4}>
      <VStack gap={2}>
        <Heading level={2} xstyle={styles.title}>
          {title}
        </Heading>
        <VStack gap={0} role="list" xstyle={styles.list}>
          {lines.map((line) => (
            <HStack
              key={line.text}
              gap={3}
              align="start"
              wrap="nowrap"
              role="listitem"
              xstyle={[styles.row, decor === 'plain' ? styles.rowRule : styles.rowIcons]}
            >
              {decor === 'icons' ? (
                <Tile small no={line.mark === 'no'}>
                  {line.icon ?? (line.mark === 'no' ? <CrossIcon /> : <CheckIcon />)}
                </Tile>
              ) : null}
              <Text xstyle={styles.lead}>{line.text}</Text>
            </HStack>
          ))}
        </VStack>
      </VStack>
    </Card>
  );
}
