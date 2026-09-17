'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import { DUMMY_CONVERSATIONS, DUMMY_STARTABLE } from '@pam/config/dummy-conversations';
import { useI18n } from '@/lib/i18n';
import { whenHappened } from '@/lib/when';
import { useDemoMessages } from '@/lib/demoMessages';

/**
 * Example conversations, and example people to start one with — what
 * `/messages/` shows a super admin previewing a role, or a real account whose
 * own real list is genuinely empty (D-172).
 *
 * **Nothing here is tappable, on purpose.** `/admin/`'s dummy `PersonRow`s
 * link to `/person/`, a read-only demo page, so tapping one is safe under any
 * identity. A real row on `/messages/` is different: tapping it calls
 * `openConversation`, a real write under the caller's own signed-in account.
 * D-171 already settled that a super admin must never originate a real
 * message, previewing or not — so these rows render as plain `Card`s with no
 * `href` and no `onClick`, not because nothing *could* be built for a fake
 * thread, but so that a real RPC call can never reach a super admin's real
 * account through this screen, now or after some later edit. See the file
 * comment in `../../../../packages/config/src/dummy-conversations.ts`.
 *
 * Loaded only through `DummyRowsLazy` (`next/dynamic`), the same reasoning
 * `SavedStripLazy` and `HomePeoplePreviewLazy` give: this renders during a
 * preview or a genuinely empty real list, not the common path for a real
 * member, case manager or program admin's own screen.
 */

const styles = stylex.create({
  row: { width: '100%' },
  name: { fontSize: '20px', lineHeight: 1.3 },
  meta: { fontSize: '16px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

export function DummyConversations({ role }: { readonly role: 'member' | 'admin' | 'provider' }) {
  const { t, locale } = useI18n();
  const demoMessages = useDemoMessages();

  /*
   * A member preview showing a demo message composed on `/person/` "arrive"
   * (D-173): if a case manager or program admin composed one this session,
   * the matching example row — the one whose `otherRole` is that sender —
   * is bumped to unread with the composed text as its preview, in place of
   * the row's own fixed example content. Only ever changes what this row
   * *displays*; nothing here reads or writes a real conversation.
   */
  const rows = DUMMY_CONVERSATIONS[role].map((c) => {
    if (role !== 'member') return c;
    const demo = demoMessages[c.otherRole as 'admin' | 'provider'];
    if (!demo) return c;
    return { ...c, lastMessageAt: demo.sentAt, unread: true, previewText: demo.text };
  });

  return (
    <VStack gap={3}>
      {rows.map((c) => (
        <Card key={c.id} xstyle={styles.row}>
          <VStack gap={2}>
            <HStack gap={3} align="center">
              <Avatar size="lg" name={c.otherFirstName} />
              <Heading level={3} xstyle={styles.name}>
                {c.otherFirstName}
              </Heading>
            </HStack>
            <HStack gap={2} wrap="wrap" align="center">
              <Badge variant="neutral" label={t(`role.${c.otherRole}`)} />
              {c.unread ? <Badge variant="info" label={t('notify.new')} /> : null}
              <Text type="supporting" xstyle={styles.meta}>
                {whenHappened(c.lastMessageAt, locale, t)}
              </Text>
            </HStack>
            {'previewText' in c ? (
              <Text type="supporting" xstyle={styles.meta}>
                {c.previewText}
              </Text>
            ) : null}
          </VStack>
        </Card>
      ))}
      <Text type="supporting" xstyle={styles.note}>
        {t('example.people.note')}
      </Text>
    </VStack>
  );
}

export function DummyStartable({ role }: { readonly role: 'admin' | 'provider' }) {
  const { t } = useI18n();
  const rows = DUMMY_STARTABLE[role];

  return (
    <VStack gap={3}>
      {rows.map((p) => (
        <Card key={p.profileId} xstyle={styles.row}>
          <HStack gap={3} align="center">
            <Avatar size="lg" name={p.firstName} />
            <Heading level={3} xstyle={styles.name}>
              {p.firstName}
            </Heading>
          </HStack>
        </Card>
      ))}
      <Text type="supporting" xstyle={styles.note}>
        {t('example.people.note')}
      </Text>
    </VStack>
  );
}
