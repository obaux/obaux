'use client';

import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { dummyConversationsFor } from '@pam/config/dummy-conversations';
import { DUMMY_EVERYONE } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useConversations } from '@/lib/useConversations';
import { whenHappened } from '@/lib/when';
import { contextFor } from '../app/messages/DummyRows';
import { HeaderActions } from './HeaderActions';
import { MessagesView, type MessageRow } from './MessagesView';

/**
 * Messages, wired (D-213): the account's real conversations
 * (`useConversations`); when there are none — every account today — the
 * example set for whoever is looking, as `/messages/` does (D-172, D-183),
 * kept for demos.
 */
export function MessagesScreen() {
  const { t, locale } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const canMessage = trueRole === 'member' || trueRole === 'admin' || trueRole === 'provider';
  const { state } = useConversations(session.status === 'signed-in' && canMessage);
  const role = viewedRole === 'admin' || viewedRole === 'provider' ? viewedRole : 'member';

  const preview = (body: string | null, mine: boolean) =>
    body === null ? t('messages.preview.none') : mine ? t('messages.preview.you', { text: body }) : body;

  const real: MessageRow[] =
    state.status === 'ready'
      ? state.conversations.map((c) => ({
          id: c.id,
          name: c.otherName ?? t('messages.thread.someone'),
          context: contextFor(role, c.otherRole ? { role: c.otherRole, programName: c.otherProgramName } : null, t),
          preview: preview(c.lastMessageBody, c.lastMessageMine),
          when: c.lastMessageAt ? whenHappened(c.lastMessageAt, locale, t) : null,
          unread: c.unread,
          href: `/messages/thread/?id=${encodeURIComponent(c.id)}`,
        }))
      : [];

  const useExamples = real.length === 0 && USE_DUMMY_PEOPLE && state.status !== 'loading';
  const examples: MessageRow[] = useExamples
    ? dummyConversationsFor(role).map((c) => {
        const other = DUMMY_EVERYONE.find((p) => p.id === c.otherId) ?? null;
        return {
          id: c.id,
          name: other?.firstName ?? t('messages.thread.someone'),
          context: contextFor(role, other ? { role: other.role, programName: other.orgName ?? null } : null, t),
          preview: c.preview ? preview(c.preview.body, c.preview.mine) : t('messages.preview.none'),
          when: c.lastMessageAt ? whenHappened(c.lastMessageAt, locale, t) : null,
          unread: c.unread,
          href: `/messages/thread/?id=${encodeURIComponent(c.id)}`,
        };
      })
    : [];

  return (
    <MessagesView
      rows={useExamples ? examples : real}
      emptyBody={t(role === 'member' ? 'messages.empty.body.member' : 'messages.empty.body.staff')}
      headerActions={<HeaderActions role={viewedRole} enabled={session.status === 'signed-in'} />}
      note={useExamples ? t('example.people.note') : null}
    />
  );
}
