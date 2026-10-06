import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { List, ListItem } from '@astryxdesign/core/List';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * What has happened that somebody has to act on — a log, not a to-do list.
 *
 * Two events reach this list: a place was flagged, and a message was reported.
 * Both are routed to the people they are actually about (A7 / D-080), so what
 * appears here is never a staff-wide bulletin. If it is in your list, it
 * concerns somebody you are responsible for.
 *
 * Two things it deliberately does not do:
 *
 *  - **It never carries anybody's words.** Each row is a translated phrase built
 *    from a key, never text a member wrote. A case manager who needs the words
 *    reads them through the review screen, behind the sensitive-information
 *    warning (D-074). A notification is a nudge to look, not a copy of the thing.
 *  - **Nothing here is marked read** (Will, 16 September, reversing part of
 *    A7). Every row used to carry its own "Mark as read" button, a chore
 *    nobody asked for on top of reading the line itself. The bell already says
 *    how many are new and clears the moment this screen is opened
 *    (`useNotifications`'s `markAllSeen`); `isNew` still marks which lines
 *    arrived since the list was last opened — read for orientation, not for
 *    a task.
 *
 * A row *is* a way to the thing it names now, when there is one (Will, 21
 * September, D-185): a reported message leads to the Reported section of
 * Messages, a new message to its conversation, a reported place to the
 * Reported places. `href` is optional — a row with nowhere to go (a place
 * taken off the list) stays a line of text. The whole row is the target,
 * the same stretched-link shape as every other row in Pam.
 *
 * **Layout (Will, 3 October: "cleaner, better hierarchy, easier to scan").**
 * The list is split into New and Earlier, so what arrived since last time
 * comes first. Each row has a round icon saying what kind of thing it is, a
 * short bold title ("Place reported"), the full sentence under it in grey
 * (two lines at most), and the time on the right. A new row also has a
 * small dot. The eye can run down the icons and titles and stop only where
 * it needs to read. Without a `title` a row falls back to its sentence
 * alone, as before.
 */

export interface NotificationItem {
  readonly id: string;
  /** Already-translated line. Built from a key by the caller — never raw text. */
  readonly text: string;
  /** Short, scannable name for the kind of event — "Place reported". */
  readonly title?: string;
  /** Drawn in the round tile at the start of the row. */
  readonly icon?: ReactNode;
  /** Human-readable, already formatted for the locale. */
  readonly when: string;
  /** Arrived since this list was last opened. Shown, never acted on. */
  readonly isNew: boolean;
  /** Where the thing it names lives, when it has a screen (D-185). */
  readonly href?: string;
}

export interface NotificationListProps {
  readonly items: readonly NotificationItem[];
  readonly labels: {
    /** "Nothing needs you right now." */
    readonly empty: string;
    /** "New" — the first section's heading. */
    readonly new: string;
    /** "Earlier" — the second section's heading. */
    readonly earlier?: string;
  };
}

const styles = stylex.create({
  list: { width: '100%' },
  section: { width: '100%' },
  heading: { fontSize: '15px', fontWeight: 600, paddingBlockStart: '8px' },
  tile: {
    width: '44px',
    height: '44px',
    flexShrink: 0,
    borderRadius: '50%',
    color: colorVars['--color-icon-primary'],
    backgroundColor: colorVars['--color-background-muted'],
  },
  icon: { width: '22px', height: '22px' },
  // The sentence, clamped to two lines: enough to know what happened.
  detail: {
    fontSize: '15px',
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  end: { alignSelf: 'flex-start', paddingBlockStart: '2px' },
  when: { fontSize: '13px', whiteSpace: 'nowrap' },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: colorVars['--color-icon-accent'],
  },
  empty: { fontSize: '17px' },
});

function Rows({ items, newLabel }: { readonly items: readonly NotificationItem[]; readonly newLabel: string }) {
  return (
    // `data-pam-list` lets globals.css set the titles at reading size:
    // Astryx draws a row's label at 14px regular, too quiet to lead a row.
    <List hasDividers density="spacious" data-pam-list="notifications">
      {items.map((item) => (
        <ListItem
          key={item.id}
          label={item.title ?? item.text}
          description={
            item.title ? (
              <Text type="supporting" xstyle={styles.detail}>
                {item.text}
              </Text>
            ) : undefined
          }
          {...(item.href ? { href: item.href } : {})}
          startContent={
            item.icon ? (
              <HStack align="center" justify="center" xstyle={styles.tile}>
                <HStack align="center" justify="center" xstyle={styles.icon}>
                  {item.icon}
                </HStack>
              </HStack>
            ) : undefined
          }
          endContent={
            <VStack gap={2} align="end" xstyle={styles.end}>
              <Text type="supporting" xstyle={styles.when}>
                {item.when}
              </Text>
              {item.isNew ? <HStack xstyle={styles.dot} role="img" aria-label={newLabel} /> : null}
            </VStack>
          }
        />
      ))}
    </List>
  );
}

export function NotificationList({ items, labels }: NotificationListProps) {
  if (items.length === 0) {
    return (
      <Text type="supporting" xstyle={styles.empty}>
        {labels.empty}
      </Text>
    );
  }

  const fresh = items.filter((i) => i.isNew);
  const older = items.filter((i) => !i.isNew);
  // One section needs no heading; two say which is which.
  const split = fresh.length > 0 && older.length > 0 && labels.earlier !== undefined;

  if (!split) {
    return (
      <VStack gap={0} xstyle={styles.list}>
        <Rows items={items} newLabel={labels.new} />
      </VStack>
    );
  }

  return (
    <VStack gap={4} xstyle={styles.list}>
      <VStack gap={1} xstyle={styles.section}>
        <Text type="supporting" xstyle={styles.heading}>
          {labels.new}
        </Text>
        <Rows items={fresh} newLabel={labels.new} />
      </VStack>
      <VStack gap={1} xstyle={styles.section}>
        <Text type="supporting" xstyle={styles.heading}>
          {labels.earlier}
        </Text>
        <Rows items={older} newLabel={labels.new} />
      </VStack>
    </VStack>
  );
}
