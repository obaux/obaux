import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';

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
}

export interface MenuListProps {
  /** The list's name for a screen reader, e.g. "Settings". */
  readonly label: string;
  readonly items: readonly MenuItem[];
}

const styles = stylex.create({
  list: { width: '100%' },
  row: { minHeight: '64px', fontSize: '18px' },
});

export function MenuList({ label, items }: MenuListProps) {
  return (
    <List aria-label={label} xstyle={styles.list}>
      {items.map((item) => (
        <ListItem
          key={item.id}
          label={item.label}
          description={item.description}
          href={item.href}
          onClick={item.onSelect ? () => item.onSelect?.() : undefined}
          startContent={item.icon}
          endContent={item.href ? <Icon icon="chevronRight" size="md" /> : undefined}
          xstyle={styles.row}
        />
      ))}
    </List>
  );
}
