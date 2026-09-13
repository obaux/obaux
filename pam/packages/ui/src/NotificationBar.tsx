'use client';

import { useId, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { BellIcon } from './icons.js';

/**
 * What has happened that somebody has to act on.
 *
 * Two events reach this list: a place was flagged, and a message was reported.
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
 *
 * The bell is a button in the header row, and the list opens beneath it rather
 * than pushing the page down — a caseload is what the screen is for, and it
 * should not move every time somebody checks whether anything is new.
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
    /** "Notifications" — the bell's accessible name. */
    readonly title: string;
    /** Already-filled, e.g. "3 new". Shown only when something is unread. */
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
  // The anchor the panel hangs from. Nothing visual.
  root: { position: 'relative', display: 'inline-flex' },
  // 48px stands even though the glyph is small: the touch target is the rule,
  // not the drawing (§2.5).
  bell: { minHeight: '48px', minWidth: '48px', fontSize: '22px' },
  panel: {
    position: { default: 'absolute', '@media (max-width: 400px)': 'fixed' },
    insetBlockStart: { default: 'calc(100% + 4px)', '@media (max-width: 400px)': null },
    insetInlineEnd: { default: 0, '@media (max-width: 400px)': null },
    // On a narrow phone the panel stops hanging off the bell and becomes a
    // sheet the width of the screen, because 300px of popover beside a 320px
    // screen is a panel half off the edge.
    left: { default: null, '@media (max-width: 400px)': '8px' },
    right: { default: null, '@media (max-width: 400px)': '8px' },
    top: { default: null, '@media (max-width: 400px)': '64px' },
    width: { default: '320px', '@media (max-width: 400px)': 'auto' },
    maxWidth: '92vw',
    maxHeight: '60vh',
    overflowY: 'auto',
    zIndex: 20,
  },
  row: { width: '100%' },
  // Reserved so a read row does not shuffle left where an unread one has a tick.
  tickSpacer: { minWidth: '40px' },
  // Smaller than body text on purpose: this is a list to scan, not to read.
  text: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    minHeight: '48px',
    fontSize: '15px',
    lineHeight: 1.3,
    textAlign: 'start',
    justifyContent: 'flex-start',
    paddingInline: '6px',
  },
  when: { fontSize: '13px', flexShrink: 0, whiteSpace: 'nowrap' },
  check: { minHeight: '48px', minWidth: '40px', fontSize: '15px', flexShrink: 0 },
  empty: { fontSize: '15px', paddingBlock: '8px' },
});

export function NotificationBar({ items, labels, onSelect, onMarkRead }: NotificationBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <div {...stylex.props(styles.root)}>
      <HStack gap={1} align="center">
        <IconButton
          label={labels.title}
          icon={<BellIcon />}
          variant="ghost"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          xstyle={styles.bell}
        />
        {/* The count is a word, not a dot: "3 new" survives being read aloud. */}
        {unreadCount > 0 && labels.unread ? (
          <Badge variant="neutral" label={labels.unread} />
        ) : null}
      </HStack>

      {isOpen ? (
        <Card id={panelId} padding={2} xstyle={styles.panel}>
          {items.length === 0 ? (
            <Text type="supporting" xstyle={styles.empty}>
              {labels.empty}
            </Text>
          ) : (
            <VStack gap={0}>
              {items.map((item) => (
                /*
                  One row, one line high. The line, when it happened and the way
                  to clear it sit side by side rather than stacked: a list of
                  three things should be readable in a glance, and stacking each
                  row into two lines turned a short list into a scroll.
                */
                <HStack key={item.id} gap={1} align="center" wrap="nowrap" xstyle={styles.row}>
                  <Button
                    label={item.text}
                    variant="ghost"
                    onClick={() => onSelect?.(item.id)}
                    xstyle={styles.text}
                  />
                  <Text type="supporting" xstyle={styles.when}>
                    {item.when}
                  </Text>
                  {item.isRead ? (
                    <span {...stylex.props(styles.tickSpacer)} aria-hidden="true" />
                  ) : (
                    // A tick, labelled for anybody not looking at it. Unread is
                    // carried by this control being here at all, so the state
                    // never depends on seeing a colour.
                    <IconButton
                      label={labels.markRead}
                      icon={<span aria-hidden="true">✓</span>}
                      variant="ghost"
                      onClick={() => onMarkRead?.(item.id)}
                      xstyle={styles.check}
                    />
                  )}
                </HStack>
              ))}
            </VStack>
          )}
        </Card>
      ) : null}
    </div>
  );
}
