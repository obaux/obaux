'use client';

import { useId, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';

/**
 * What has happened that somebody has to act on.
 *
 * Two events reach this bar: a place was flagged, and a message was reported.
 * Both are routed to the people they are actually about (A7 / D-080) — every
 * super admin, plus the case managers of the members affected — so what appears
 * here is never a staff-wide bulletin. If it is in your list, it concerns
 * somebody you are responsible for.
 *
 * Three things this deliberately does not do:
 *
 *  - **It never carries anybody's words.** Each row is a translated phrase built
 *    from a key, never text a member wrote. A case manager who needs the words
 *    reads them through the review screen, behind the sensitive-information
 *    warning (D-074). A notification is a nudge to look, not a copy of the thing.
 *  - **It does not shout.** No red dot, no animation. These are things to attend
 *    to, not emergencies, and a permanently alarmed interface teaches people to
 *    ignore it.
 *  - **It does not mark things read by being looked at.** Reading a list is not
 *    the same as dealing with what is in it, and a count that clears itself
 *    hides work.
 */

export interface NotificationItem {
  readonly id: string;
  /** Already-translated line. Built from a key by the caller — never raw text. */
  readonly text: string;
  /** Human-readable, already formatted for the locale. */
  readonly when: string;
  readonly isRead: boolean;
}

export interface NotificationBarProps {
  readonly items: readonly NotificationItem[];
  readonly labels: {
    /** "Notifications" */
    readonly title: string;
    /** Already-filled, e.g. "3 new". Omitted when nothing is unread. */
    readonly unread?: string;
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
  bar: { width: '100%' },
  toggle: { minHeight: '48px', fontSize: '17px' },
  panel: {
    width: '100%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(127, 127, 127, 0.35)',
    borderRadius: '12px',
    padding: '8px',
  },
  row: {
    width: '100%',
    borderRadius: '8px',
    paddingInline: '8px',
    paddingBlock: '4px',
    backgroundColor: { default: 'transparent', ':hover': 'rgba(127, 127, 127, 0.10)' },
  },
  // Unread is carried by weight and a word, never by colour alone.
  unreadRow: { backgroundColor: 'rgba(127, 127, 127, 0.14)' },
  text: { fontSize: '17px', lineHeight: 1.4, textAlign: 'start' },
  when: { fontSize: '15px' },
  // Full width and left-aligned: these are lines of text to read down, not
  // labels to centre. A centred row above a left-aligned date reads as two
  // unrelated things.
  open: {
    width: '100%',
    minHeight: '48px',
    fontSize: '17px',
    textAlign: 'start',
    justifyContent: 'flex-start',
  },
  action: { minHeight: '48px', fontSize: '15px' },
  empty: { fontSize: '17px', paddingInline: '8px', paddingBlock: '8px' },
});

export function NotificationBar({ items, labels, onSelect, onMarkRead }: NotificationBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <div {...stylex.props(styles.bar)}>
      <VStack gap={1}>
        <HStack gap={2} align="center" wrap="wrap">
          <Button
            label={labels.title}
            variant="ghost"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls={panelId}
            xstyle={styles.toggle}
          />
          {/* The count is a word, not a dot: "3 new" survives being read aloud. */}
          {unreadCount > 0 && labels.unread ? (
            <Badge variant="neutral" label={labels.unread} />
          ) : null}
        </HStack>

        {isOpen ? (
          <div id={panelId} {...stylex.props(styles.panel)}>
            {items.length === 0 ? (
              <Text type="supporting" xstyle={styles.empty}>
                {labels.empty}
              </Text>
            ) : (
              <VStack gap={1}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    {...stylex.props(styles.row, !item.isRead && styles.unreadRow)}
                  >
                    <VStack gap={0}>
                      <Button
                        label={item.text}
                        variant="ghost"
                        onClick={() => onSelect?.(item.id)}
                        xstyle={styles.open}
                      />
                      <HStack gap={2} align="center" wrap="wrap">
                        <Text type="supporting" xstyle={styles.when}>
                          {item.when}
                        </Text>
                        {item.isRead ? null : (
                          <Button
                            label={labels.markRead}
                            variant="ghost"
                            onClick={() => onMarkRead?.(item.id)}
                            xstyle={styles.action}
                          />
                        )}
                      </HStack>
                    </VStack>
                  </div>
                ))}
              </VStack>
            )}
          </div>
        ) : null}
      </VStack>
    </div>
  );
}
