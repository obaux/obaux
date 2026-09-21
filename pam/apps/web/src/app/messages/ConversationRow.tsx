'use client';

import * as stylex from '@stylexjs/stylex';
import { ListItem } from '@astryxdesign/core/List';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

/**
 * One conversation in the list — a row, not a card (D-186).
 *
 * Astryx's `ListItem` with `href`: avatar at the start, the name as the
 * label, a context line and the last thing said underneath, and the time
 * with an unread mark at the end. One tap target per row, the library's own
 * invisible-anchor pattern rather than a hand-rolled stretched link; 48px
 * comes from the list's density and is stated below so a row with a short
 * preview cannot shrink under it.
 *
 * The context line (D-187) is what the name alone cannot say: "Case
 * manager" for a member looking at theirs, the program's name for a member
 * looking at a program, and nothing at all when a case manager or a program
 * is looking at a member — a member is the person, not a category.
 *
 * Shared by the real list and the example list, so the two cannot drift.
 */
export interface ConversationRowProps {
  readonly name: string;
  readonly context: string | null;
  readonly preview: string;
  readonly when: string | null;
  readonly unread: boolean;
  readonly unreadLabel: string;
  readonly href: string;
}

const styles = stylex.create({
  item: { minHeight: '48px' },
  context: { fontSize: '15px', lineHeight: 1.3 },
  preview: {
    fontSize: '18px',
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  previewUnread: { fontWeight: 600 },
  when: { fontSize: '14px', whiteSpace: 'nowrap' },
  end: { alignItems: 'flex-end', flexShrink: 0 },
});

export function ConversationRow({ name, context, preview, when, unread, unreadLabel, href }: ConversationRowProps) {
  return (
    <ListItem
      label={name}
      href={href}
      startContent={<Avatar size="md" name={name} />}
      description={
        <VStack gap={0}>
          {context ? (
            <Text type="supporting" xstyle={styles.context}>
              {context}
            </Text>
          ) : null}
          <Text type={unread ? 'body' : 'supporting'} xstyle={unread ? [styles.preview, styles.previewUnread] : styles.preview}>
            {preview}
          </Text>
        </VStack>
      }
      endContent={
        <VStack gap={1} xstyle={styles.end}>
          {when ? (
            <Text type="supporting" xstyle={styles.when}>
              {when}
            </Text>
          ) : null}
          {unread ? <Badge variant="info" label={unreadLabel} /> : null}
        </VStack>
      }
    />
  );
}
