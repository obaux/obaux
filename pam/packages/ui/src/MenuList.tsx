import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { pam } from './tokens.stylex.js';
import { Icon } from '@astryxdesign/core/Icon';
import { HStack } from '@astryxdesign/core/HStack';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from './Badge.js';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CheckIcon } from './icons.js';
import { OptionTag, TaggedWords } from './OptionTag.js';

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
  /** A Pam icon drawn at 26px (`width={26} height={26}`). */
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
  /**
   * A count before the chevron — "2" new messages on "Message Marcus"
   * (D-231). Only a count: a Badge says how many, never a status.
   */
  readonly badge?: string;
  /** The badge's spoken meaning — "2 new messages". */
  readonly badgeLabel?: string;
  /** Opens in a new tab: Google Maps, a program's website (D-291). */
  readonly isExternal?: boolean;
  /**
   * Something new behind this row — a pink dot before the chevron, the same
   * pink as every other "new" dot (D-289, D-305). Decoration: the row's own
   * words say it ("New message").
   */
  readonly hasDot?: boolean;
  /** One line, then "…" — a message's preview (Will, D-306). */
  readonly isDescriptionOneLine?: boolean;
  /**
   * A short tag before the label, in a cell of its own: "EN", "PT-BR", "AR"
   * before a language's own name (Will, 10 October 2026, D-449). Always English,
   * always left to right, hidden from a screen reader: the row's name stays its
   * label. Rows in one list line up whatever their tag.
   */
  readonly tag?: string;
  /**
   * The language the label is written in ("ru", "ar"), so a screen reader
   * speaks "Русский" in a Russian voice and the word reads the way its own
   * script does. Astryx's rows take no `lang`, so it goes on a span round the
   * label. Without it nothing changes.
   */
  readonly lang?: string;
  /**
   * The same tag, before the `value` at the right — Profile's Language row,
   * "EN English". It takes only the room its letters need. Shown with `value`;
   * hidden from a screen reader.
   */
  readonly valueTag?: string;
}

export interface MenuListProps {
  /** The list's name for a screen reader, e.g. "Settings". */
  readonly label: string;
  readonly items: readonly MenuItem[];
  /** Subtle lines between rows — a list of places to pick from (D-235). */
  readonly hasDividers?: boolean;
  /**
   * Rows keep Astryx's own padding before the icon and after the chevron. Only
   * for a list inside something with no padding of its own — a card with a
   * thin edge, the floating action's dock. Every other list is flush: its icons
   * and chevrons line up with the title above and the page's own margin (Will,
   * 10 October 2026, D-439: "icon based items … should not have left padding,
   * so it's flush with header and page layout").
   */
  readonly isInset?: boolean;
}

const styles = stylex.create({
  list: { width: '100%' },
  row: { minHeight: '64px', fontSize: '18px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, backgroundColor: pam['--pam-brand-pink'] },
  // No line under the last row (D-291). Astryx's own `:last-child` rule
  // is a shorthand, which loses to its longhand width, so the line stayed —
  // a stray rule at the foot of every card that holds a list.
  lastRow: { borderBlockEndWidth: '0px' },
  flush: { paddingInlineStart: '0px', paddingInlineEnd: '0px' },
  value: { fontSize: '16px' },
  // The label at 18px (§2.5): ListItem's own label size is smaller.
  label: { fontSize: '18px', lineHeight: 1.35 },
  // Smaller than the label, so the row reads as a name and a note
  // (Will, 5 October, D-294).
  description: { fontSize: '14px', lineHeight: 1.35 },
  oneLine: { display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', unicodeBidi: 'plaintext', minWidth: 0, maxWidth: '100%' },
  // The chosen option (Will, 5 October, D-274): bold and in the accent
  // green, words and tick alike, with a heavier tick — a thin black tick at
  // the far edge was easy to miss.
  labelSelected: { fontWeight: 700, color: colorVars['--color-text-accent'] },
  check: { width: '24px', height: '24px', color: colorVars['--color-icon-accent'], flexShrink: 0 },
});

export function MenuList({ label, items, hasDividers = false, isInset = false }: MenuListProps) {
  return (
    <List aria-label={label} hasDividers={hasDividers} xstyle={styles.list}>
      {items.map((item, index) => (
        <ListItem
          key={item.id}
          label={
            <Text xstyle={[styles.label, item.isSelected === true && styles.labelSelected]}>
              <TaggedWords tag={item.tag} lang={item.lang}>
                {item.label}
              </TaggedWords>
            </Text>
          }
          description={
            item.description ? (
              <Text type="supporting" xstyle={[styles.description, item.isDescriptionOneLine === true && styles.oneLine]}>
                {item.description}
              </Text>
            ) : undefined
          }
          href={item.href}
          {...(item.href && item.isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
          onClick={item.onSelect ? () => item.onSelect?.() : undefined}
          startContent={item.icon}
          {...(item.isSelected !== undefined ? { 'aria-current': item.isSelected ? ('true' as const) : undefined } : {})}
          endContent={
            item.isSelected !== undefined ? (
              item.isSelected ? (
                <CheckIcon {...stylex.props(styles.check)} aria-hidden />
              ) : undefined
            ) : item.href || item.onSelect ? (
              <HStack gap={2} align="center" wrap="nowrap">
                {item.hasDot ? <HStack aria-hidden xstyle={styles.dot} /> : null}
                {item.badge ? <Badge variant="error" label={item.badge} aria-label={item.badgeLabel} /> : null}
                {item.value && item.valueTag ? <OptionTag tag={item.valueTag} isFixedWidth={false} /> : null}
                {item.value ? (
                  <Text type="supporting" xstyle={styles.value}>
                    {item.value}
                  </Text>
                ) : null}
                <Icon icon="chevronRight" size="md" />
              </HStack>
            ) : undefined
          }
          xstyle={[styles.row, !isInset && styles.flush, index === items.length - 1 && styles.lastRow]}
        />
      ))}
    </List>
  );
}
