'use client';

import { useMemo, useState } from 'react';
import { PageTitle } from '@pam/ui';
import type { Role } from '@pam/config';
import { dummyConversationPair, dummySideFor, dummyThreadFor } from '@pam/config/dummy-conversations';
import { DUMMY_EVERYONE } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { sendDemoThreadMessage, useDemoThread } from '@/lib/demoMessages';
import { ThreadView } from './ThreadView';

/**
 * An example conversation, for a role preview (D-180, D-183): the written
 * thread for this pair — `mine` flipped for the previewed role's side — plus
 * whatever this tab has typed into it, through the same `ThreadView` the
 * real thread uses. A pair with no written thread (a "Start a conversation"
 * row, `/person/`'s "Message Aaliyah") is an empty log with a composer.
 * Sending appends to sessionStorage (`demoMessages.ts`) and nothing else;
 * there is no `onReport`, because a report is a real safety action with real
 * recipients and an example conversation has neither.
 */
export function DemoThread({
  conversationId,
  role,
  speechLanguage,
  supportPhone,
}: {
  readonly conversationId: string;
  readonly role: Role;
  readonly speechLanguage: string;
  readonly supportPhone: string;
}) {
  const { t } = useI18n();
  const typed = useDemoThread(conversationId);
  const [added, setAdded] = useState<{ id: string; body: string; at: string }[]>([]);

  const pair = dummyConversationPair(conversationId);
  const otherId = pair ? (dummySideFor(role) === 'member' ? pair.staffId : pair.memberId) : null;
  const other = DUMMY_EVERYONE.find((p) => p.id === otherId) ?? null;

  const messages = useMemo(
    () => [
      ...dummyThreadFor(conversationId, role).map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.at,
        mine: m.mine,
      })),
      ...[...typed, ...added].map((m) => ({ id: m.id, body: m.body, createdAt: m.at, mine: true })),
    ],
    [conversationId, role, typed, added],
  );

  const send = async (body: string) => {
    const message = sendDemoThreadMessage(conversationId, body);
    if (!message) return false;
    setAdded((prev) => [...prev, message]);
    return true;
  };

  return (
    <>
      <PageTitle
        title={other?.firstName ?? t('messages.thread.someone')}
        backHref="/messages/"
        backLabel={t('nav.back.messages')}
      />
      <ThreadView
        messages={messages}
        otherName={other?.firstName ?? null}
        onSend={send}
        sending={false}
        sendFailed={false}
        speechLanguage={speechLanguage}
        supportPhone={supportPhone}
      />
    </>
  );
}
