import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';

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
 * the same stretched-link shape as every other row in PAM.
 */

export interface NotificationItem {
  readonly id: string;
  /** Already-translated line. Built from a key by the caller — never raw text. */
  readonly text: string;
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
    /** "New" */
    readonly new: string;
  };
}

const styles = stylex.create({
  list: { width: '100%' },
  row: { width: '100%', paddingBlock: '10px', position: 'relative', minHeight: '48px' },
  link: {
    color: 'inherit',
    textDecoration: 'none',
    '::after': { content: '""', position: 'absolute', inset: 0 },
  },
  text: {
    fontSize: '17px',
    lineHeight: 1.35,
  },
  // The ones that arrived since somebody last looked read slightly heavier —
  // an orientation cue, not a status to clear.
  textNew: { fontWeight: 700 },
  when: { fontSize: '15px' },
  empty: { fontSize: '17px' },
});

export function NotificationList({ items, labels }: NotificationListProps) {
  if (items.length === 0) {
    return (
      <Text type="supporting" xstyle={styles.empty}>
        {labels.empty}
      </Text>
    );
  }

  return (
    <VStack gap={0} xstyle={styles.list}>
      {items.map((item) => (
        // One row, one line: what happened, then when and — for the ones that
        // are new — a label saying so. Plain text throughout; nothing here
        // responds to a tap.
        <VStack key={item.id} gap={1} xstyle={styles.row}>
          <Text xstyle={item.isNew ? [styles.text, styles.textNew] : styles.text}>
            {item.href ? (
              <a href={item.href} {...stylex.props(styles.link)}>
                {item.text}
              </a>
            ) : (
              item.text
            )}
          </Text>
          <HStack gap={2} align="center" wrap="wrap">
            <Text type="supporting" xstyle={styles.when}>
              {item.when}
            </Text>
            {item.isNew ? <Badge variant="neutral" label={labels.new} /> : null}
          </HStack>
        </VStack>
      ))}
    </VStack>
  );
}
