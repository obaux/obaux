'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import {
  DUMMY_SELF_ID,
  DUMMY_STARTABLE,
  dummyConversationIdBetween,
  dummyConversationsFor,
} from '@pam/config/dummy-conversations';
import { DUMMY_EVERYONE } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { whenHappened } from '@/lib/when';

/**
 * Example conversations, and example people to start one with — what
 * `/messages/` shows a super admin previewing a role, or a real account whose
 * own real list is genuinely empty (D-172, D-183).
 *
 * **Every row here opens an example thread**, and only an example thread:
 * `/messages/thread/?id=dummy-conv-…`, which that screen recognises and
 * answers from `DUMMY_THREADS` plus a session-only store — through the same
 * `ThreadView` as a real thread, never `useThread`, never a real insert
 * (D-180). A "Start a conversation" row that has no written thread opens an
 * empty one with a composer (D-183); nothing it does can reach
 * `openConversation` (D-172's guarantee, kept by construction: a
 * `dummy-conv-` id is never handed to any real hook).
 *
 * Loaded only through `DummyRowsLazy` (`next/dynamic`), the same reasoning
 * `SavedStripLazy` and `HomePeoplePreviewLazy` give.
 */

const styles = stylex.create({
  row: { width: '100%', position: 'relative' },
  name: { fontSize: '20px', lineHeight: 1.3 },
  meta: { fontSize: '16px' },
  preview: {
    fontSize: '16px',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  note: { fontSize: '15px', lineHeight: 1.5 },
  // Stretched-link, the same as `PersonRow`: the heading is a real anchor
  // widened over the whole card, so the card is one target.
  link: {
    color: 'inherit',
    textDecoration: 'none',
    '::after': { content: '""', position: 'absolute', inset: 0 },
  },
});

function person(id: string) {
  return DUMMY_EVERYONE.find((p) => p.id === id) ?? null;
}

export function DummyConversations({ role }: { readonly role: 'member' | 'admin' | 'provider' }) {
  const { t, locale } = useI18n();
  const rows = dummyConversationsFor(role);

  return (
    <VStack gap={3}>
      {rows.map((c) => {
        const other = person(c.otherId);
        const name = other?.firstName ?? t('messages.thread.someone');
        return (
          <Card key={c.id} xstyle={styles.row}>
            <VStack gap={2}>
              <HStack gap={3} align="center">
                <Avatar size="lg" name={name} />
                <Heading level={3} xstyle={styles.name}>
                  <a href={`/messages/thread/?id=${encodeURIComponent(c.id)}`} {...stylex.props(styles.link)}>
                    {name}
                  </a>
                </Heading>
              </HStack>
              <HStack gap={2} wrap="wrap" align="center">
                {other ? <Badge variant="neutral" label={t(`role.${other.role}`)} /> : null}
                {c.unread ? <Badge variant="info" label={t('notify.new')} /> : null}
                {c.lastMessageAt ? (
                  <Text type="supporting" xstyle={styles.meta}>
                    {whenHappened(c.lastMessageAt, locale, t)}
                  </Text>
                ) : null}
              </HStack>
              <Text type="supporting" xstyle={styles.preview}>
                {c.preview === null
                  ? t('messages.preview.none')
                  : c.preview.mine
                    ? t('messages.preview.you', { text: c.preview.body })
                    : c.preview.body}
              </Text>
            </VStack>
          </Card>
        );
      })}
      <Text type="supporting" xstyle={styles.note}>
        {t('example.people.note')}
      </Text>
    </VStack>
  );
}

export function DummyStartable({ role }: { readonly role: 'member' | 'admin' | 'provider' }) {
  const { t } = useI18n();
  const self = DUMMY_SELF_ID[role];
  const rows = DUMMY_STARTABLE[role];

  if (rows.length === 0) {
    return (
      <Text type="supporting" xstyle={styles.note}>
        {t('messages.start.empty.body')}
      </Text>
    );
  }

  return (
    <VStack gap={3}>
      {rows.map((id) => {
        const p = person(id);
        if (!p) return null;
        // A member's staff person is the other side; for staff, the member is.
        const conversationId =
          role === 'member' ? dummyConversationIdBetween(self, id) : dummyConversationIdBetween(id, self);
        return (
          <Card key={id} xstyle={styles.row}>
            <HStack gap={3} align="center">
              <Avatar size="lg" name={p.firstName} />
              <Heading level={3} xstyle={styles.name}>
                <a href={`/messages/thread/?id=${encodeURIComponent(conversationId)}`} {...stylex.props(styles.link)}>
                  {p.firstName}
                </a>
              </Heading>
            </HStack>
          </Card>
        );
      })}
      <Text type="supporting" xstyle={styles.note}>
        {t('example.people.note')}
      </Text>
    </VStack>
  );
}
