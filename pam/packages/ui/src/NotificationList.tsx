'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';

/**
 * What has happened that somebody has to act on.
 *
 * Two events reach this list: a place was flagged, and a message was reported.
 * Both are routed to the people they are actually about (A7 / D-080) — every
 * super admin, plus the case managers of the members affected — so what appears
 * here is never a staff-wide bulletin. If it is in your list, it concerns
 * somebody you are responsible for.
 *
 * Two things it deliberately does not do:
 *
 *  - **It never carries anybody's words.** Each row is a translated phrase built
 *    from a key, never text a member wrote. A case manager who needs the words
 *    reads them through the review screen, behind the sensitive-information
 *    warning (D-074). A notification is a nudge to look, not a copy of the thing.
 *  - **It does not mark things read by being looked at.** Reading a list is not
 *    the same as dealing with what is in it, and a count that clears itself
 *    hides work from the person who has to do it.
 */

export interface NotificationItem {
  readonly id: string;
  /** Already-translated line. Built from a key by the caller — never raw text. */
  readonly text: string;
  /** Human-readable, already formatted for the locale. */
  readonly when: string;
  readonly isRead: boolean;
}

export interface NotificationListProps {
  readonly items: readonly NotificationItem[];
  readonly labels: {
    /** "Nothing needs you right now." */
    readonly empty: string;
    /** "Mark as read" */
    readonly markRead: string;
  };
  /** Opening a row goes to the person or the place it is about. */
  readonly onSelect?: (id: string) => void;
  readonly onMarkRead?: (id: string) => void;
}

const styles = stylex.create({
  list: { width: '100%' },
  row: { width: '100%' },
  text: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    minHeight: '48px',
    fontSize: '17px',
    lineHeight: 1.35,
    textAlign: 'start',
    justifyContent: 'flex-start',
    paddingInline: '4px',
  },
  when: { fontSize: '15px', flexShrink: 0, whiteSpace: 'nowrap' },
  check: { minHeight: '48px', fontSize: '15px' },
  meta: { paddingInline: '4px' },
  empty: { fontSize: '17px' },
});

export function NotificationList({
  items,
  labels,
  onSelect,
  onMarkRead,
}: NotificationListProps) {
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
        /*
          One row, one line. What happened, when, and the way to clear it, side
          by side rather than stacked: this is a list to scan, and stacking each
          row into two lines turns a short list into a scroll.
        */
        <VStack key={item.id} gap={0} xstyle={styles.row}>
          {/*
            The line, then when and the tick beneath it. On a screen of its own
            there is room to show the whole sentence, and a notice cut off at
            "Someone said a message i…" is a notice somebody has to open to
            understand — which defeats a list meant for scanning.
          */}
          <Button
            label={item.text}
            variant="ghost"
            onClick={() => onSelect?.(item.id)}
            xstyle={styles.text}
          />
          <HStack gap={2} align="center" wrap="wrap" xstyle={styles.meta}>
            <Text type="supporting" xstyle={styles.when}>
              {item.when}
            </Text>
            {item.isRead ? null : (
              // Labelled in words here: a screen has room, and "Mark as read"
              // beats a tick somebody has to hover to understand.
              <Button
                label={labels.markRead}
                variant="ghost"
                onClick={() => onMarkRead?.(item.id)}
                xstyle={styles.check}
              />
            )}
          </HStack>
        </VStack>
      ))}
    </VStack>
  );
}
