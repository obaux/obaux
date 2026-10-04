'use client';

import { useMemo, useState } from 'react';
import type { Role } from '@pam/config';
import { dummyOtherIdFor, dummyThreadFor } from '@pam/config/dummy-conversations';
import { DUMMY_ANYONE } from '@pam/config/dummy-people';
import { contextFor } from './DummyRows';
import { useI18n } from '@/lib/i18n';
import { sendDemoThreadMessage, useDemoThread } from '@/lib/demoMessages';
import { ThreadView } from './ThreadView';
import { ThreadHeader } from './ThreadFrame';

/**
 * An example conversation, for a role preview (D-180, D-183): the written
 * thread for this pair — `mine` flipped for the previewed role's side — plus
 * whatever this tab has typed into it, through the same `ThreadView` the
 * real thread uses. A pair with no written thread (a "Start a conversation"
 * row, `/person/`'s "Message Aaliyah") is an empty log with a composer.
 * Sending appends to sessionStorage (`demoMessages.ts`) and nothing else;
 * its ⋯ page's Report sends nothing, because a report is a real safety action
 * with real recipients and an example conversation has neither.
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

  const otherId = dummyOtherIdFor(conversationId, role);
  const other = DUMMY_ANYONE.find((p) => p.id === otherId) ?? null;

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

  // D-187: a member sees who this is to them; staff see nothing beside a
  // member's name; the PAM team is named as such (D-262).
  const context = contextFor(role, other ? { role: other.role, programName: other.orgName ?? null } : null, t);

  return (
    <>
      <ThreadHeader
        name={other?.firstName ?? t('messages.thread.someone')}
        context={context}
        backHref="/messages/"
        backLabel={t('nav.back.messages')}
        menuHref={`/messages/thread/options/?id=${encodeURIComponent(conversationId)}`}
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
