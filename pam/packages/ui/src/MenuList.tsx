import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack } from '@astryxdesign/core/HStack';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';

/**
 * A plain list of places to go, one per row: icon, words, chevron (D-210).
 * Rows, not cards — Astryx's rule for lists, and the reference's — at 64px
 * so each is an easy target, with 18px labels.
 *
 * A row is a link (`href`) or, for the one that is an action rather than a
 * place — signing out — a button (`onSelect`). Either way the whole row is the
 * target, through `ListItem`'s own invisible-anchor/button pattern.
 */
export interface MenuItem {
  readonly id: string;
  readonly label: string;
  /** A PAM icon drawn at 26px (`width={26} height={26}`). */
  readonly icon: ReactNode;
  readonly href?: string;
  readonly onSelect?: () => void;
  /** Quieter, shown under the label. */
  readonly description?: string;
  /** Shown at the right, before the chevron — the current choice ("English"). */
  readonly value?: string;
  /**
   * A choice in a list of choices (Language, D-213): a tick instead of a
   * chevron, and `aria-current` so a screen reader hears which is chosen.
   */
  readonly isSelected?: boolean;
}

export interface MenuListProps {
  /** The list's name for a screen reader, e.g. "Settings". */
  readonly label: string;
  readonly items: readonly MenuItem[];
}

const styles = stylex.create({
  list: { width: '100%' },
  row: { minHeight: '64px', fontSize: '18px' },
  value: { fontSize: '16px' },
  // The label at 18px (§2.5): ListItem's own label size is smaller.
  label: { fontSize: '18px', lineHeight: 1.35 },
  description: { fontSize: '15px', lineHeight: 1.4 },
});

export function MenuList({ label, items }: MenuListProps) {
  return (
    <List aria-label={label} xstyle={styles.list}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          label={<Text xstyle={styles.label}>{item.label}</Text>}
          description={
            item.description ? (
              <Text type="supporting" xstyle={styles.description}>
                {item.description}
              </Text>
            ) : undefined
          }
          href={item.href}
          onClick={item.onSelect ? () => item.onSelect?.() : undefined}
          startContent={item.icon}
          {...(item.isSelected !== undefined ? { 'aria-current': item.isSelected ? ('true' as const) : undefined } : {})}
          endContent={
            item.isSelected !== undefined ? (
              item.isSelected ? (
                <Icon icon="check" size="md" />
              ) : undefined
            ) : item.href ? (
              <HStack gap={2} align="center" wrap="nowrap">
                {item.value ? (
                  <Text type="supporting" xstyle={styles.value}>
                    {item.value}
                  </Text>
                ) : null}
                <Icon icon="chevronRight" size="md" />
              </HStack>
            ) : undefined
          }
          xstyle={styles.row}
        />
      ))}
    </List>
  );
}
