'use client';

import { useMemo, useState } from 'react';
import { PageTitle } from '@pam/ui';
import { DUMMY_THREADS, dummyConversationById } from '@pam/config/dummy-conversations';
import { useI18n } from '@/lib/i18n';
import { sendDemoThreadMessage, useDemoThread } from '@/lib/demoMessages';
import { ThreadView } from './ThreadView';

/**
 * An example conversation, for a role preview (D-180): `DUMMY_THREADS`'
 * fixed lines plus whatever this tab has typed into it, through the same
 * `ThreadView` the real thread uses — so a preview shows the real
 * component, not a sketch of it. Sending appends to sessionStorage
 * (`demoMessages.ts`) and nothing else; there is no `onReport`, because a
 * report is a real safety action with real recipients and an example
 * conversation has neither.
 */
export function DemoThread({
  conversationId,
  speechLanguage,
  supportPhone,
}: {
  readonly conversationId: string;
  readonly speechLanguage: string;
  readonly supportPhone: string;
}) {
  const { t } = useI18n();
  const typed = useDemoThread(conversationId);
  const [added, setAdded] = useState<{ id: string; body: string; at: string }[]>([]);
  const other = dummyConversationById(conversationId);

  const messages = useMemo(
    () => [
      ...(DUMMY_THREADS[conversationId] ?? []).map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.at,
        mine: m.mine,
      })),
      ...[...typed, ...added].map((m) => ({ id: m.id, body: m.body, createdAt: m.at, mine: true })),
    ],
    [conversationId, typed, added],
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
        title={other?.otherFirstName ?? t('messages.thread.someone')}
        backHref="/messages/"
        backLabel={t('nav.back.messages')}
      />
      <ThreadView
        messages={messages}
        otherName={other?.otherFirstName ?? null}
        onSend={send}
        sending={false}
        sendFailed={false}
        speechLanguage={speechLanguage}
        supportPhone={supportPhone}
      />
    </>
  );
}
