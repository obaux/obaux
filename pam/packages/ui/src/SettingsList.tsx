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
}

const styles = stylex.create({
  row: { paddingBlock: '16px', minHeight: '64px' },
  words: { flexGrow: 1, minWidth: 0 },
  label: { fontSize: '17px', lineHeight: 1.35, fontWeight: 600 },
  control: { flexShrink: 0 },
});

export function SettingsRow({ label, adornment, badge, badgeId, control }: SettingsRowProps) {
  return (
    <HStack gap={3} align="center" wrap="nowrap" xstyle={styles.row}>
      <VStack gap={1} xstyle={styles.words}>
        <HStack gap={0} align="center" wrap="nowrap">
          <Text xstyle={styles.label}>{label}</Text>
          {adornment}
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
