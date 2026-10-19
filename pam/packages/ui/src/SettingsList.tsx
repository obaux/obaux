'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { StatusBadge } from './StatusBadge.js';

/**
 * A list of settings (D-615, Will, 18 October, on Text alerts): no card around it, each setting
 * its own row, rows divided by a thin line. A row is the name, then — under the name, so a long
 * name in another language has the whole width — the badge when the setting is not on yet, and the
 * switch (or whatever controls it) at the end.
 *
 * Rows that are not on yet (a badge) go below the rows that are, in their own order (Will, 18 October); the caller orders them.
 *
 * Laid out in logical directions only, so it mirrors in Arabic; the name wraps and the row grows
 * rather than cutting words (320px, the longest language). The control keeps its 48px target.
 */
export interface SettingsRowProps {
  /** The setting's name, drawn at 17px. */
  readonly label: ReactNode;
  /** Beside the name, for a word the glossary explains. */
  readonly adornment?: ReactNode;
  /** "Coming soon" and the like (D-612), under the name. */
  readonly badge?: string | undefined;
  /** The id of the element that holds the badge, so the control can name it as its description. */
  readonly badgeId?: string | undefined;
  /** The switch. */
  readonly control: ReactNode;
  /** The id of the control, so a tap on the name works it too: the name is its label, one control and not two tap targets. */
  readonly labelFor?: string | undefined;
}

const styles = stylex.create({
  row: { paddingBlock: '16px', minHeight: '64px' },
  words: { flexGrow: 1, minWidth: 0 },
  label: { fontSize: '17px', lineHeight: 1.35, fontWeight: 600 },
  control: { flexShrink: 0 },
  // The (i) keeps its 48px target but is not allowed to make the name's line taller: the line is the name's own height
  // and the button overflows it evenly, so every row has the same name-to-badge gap and switch position with or without one.
  adornment: { height: '23px', flexShrink: 0, overflow: 'visible' },
});

export function SettingsRow({ label, adornment, badge, badgeId, control, labelFor }: SettingsRowProps) {
  return (
    <HStack gap={3} align="center" wrap="nowrap" xstyle={styles.row}>
      <VStack gap={1} xstyle={styles.words}>
        <HStack gap={0} align="center" wrap="nowrap">
          <Text {...(labelFor ? { as: 'label' as const, htmlFor: labelFor } : {})} xstyle={styles.label}>
            {label}
          </Text>
          {adornment ? (
            <HStack align="center" xstyle={styles.adornment}>
              {adornment}
            </HStack>
          ) : null}
        </HStack>
        {badge ? (
          <span id={badgeId}>
            <StatusBadge label={badge} />
          </span>
        ) : null}
      </VStack>
      <HStack align="center" xstyle={styles.control}>
        {control}
      </HStack>
    </HStack>
  );
}

/** The rows, each under a thin line but the first. Rows go in as children; the list adds the lines. */
export function SettingsList({ children }: { readonly children: readonly ReactNode[] | ReactNode }) {
  const rows = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return (
    <VStack gap={0}>
      {rows.map((row, index) => (
        <VStack key={index} gap={0}>
          {index > 0 ? <Divider /> : null}
          {row}
        </VStack>
      ))}
    </VStack>
  );
}
