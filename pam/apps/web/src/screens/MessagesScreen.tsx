'use client';

import { staffPhotoFor } from '@pam/config/dummy-connections';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { isFreshAccount } from '@/lib/programSetup';
import { dummyConversationsFor } from '@pam/config/dummy-conversations';
import { DUMMY_ANYONE } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useConversations } from '@/lib/useConversations';
import { whenHappened } from '@/lib/when';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { contextFor, dummyPickerPeople, pickerContextFor } from '../app/messages/DummyRows';
import { NewMessagePickerLazy } from '../app/messages/NewMessagePickerLazy';
import type { PickablePerson } from '../app/messages/NewMessagePicker';
import { useMessageableMembers } from '@/lib/useMessageableMembers';
import { openConversation } from '@/lib/openConversation';
import { HeaderActions } from './HeaderActions';
import { FloatingAction } from '@pam/ui/FloatingAction';
import { ConnectionsIcon } from '@pam/ui';
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
  // The super admin may message staff, to help them start (0072, D-262).
  const canMessage =
    trueRole === 'member' || trueRole === 'admin' || trueRole === 'provider' || trueRole === 'super_admin';
  const { state } = useConversations(session.status === 'signed-in' && canMessage);
  const role =
    viewedRole === 'admin' || viewedRole === 'provider' || viewedRole === 'super_admin' ? viewedRole : 'member';

  // New message (D-220): everyone this person may message, in the same sheet
  // with a search box the old screen used (D-186) — real people when there
  // are any, the example cast otherwise, as the list above does.
  const { state: messageable } = useMessageableMembers(session.status === 'signed-in' && canMessage);
  const [picking, setPicking] = useState(false);
  const realPeople = useMemo<readonly PickablePerson[]>(
    () =>
      messageable.status === 'ready'
        ? messageable.people.map((p) => ({
            id: p.profileId,
            name: p.firstName ?? t('messages.thread.someone'),
            context: pickerContextFor({ role: p.role, programName: null }, t),
          }))
        : [],
    [messageable, role, t],
  );
  const pickerExamples = useMemo(() => (USE_DUMMY_PEOPLE ? dummyPickerPeople(role, t) : null), [role, t]);
  const useExamplePeople = realPeople.length === 0 && pickerExamples !== null;
  const pick = useCallback(
    async (id: string): Promise<string | null> => {
      if (useExamplePeople) return pickerExamples?.hrefFor(id) ?? null;
      const conversationId = await openConversation(id);
      return conversationId ? `/messages/thread/?id=${encodeURIComponent(conversationId)}` : null;
    },
    [useExamplePeople, pickerExamples],
  );

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
          photoUrl: staffPhotoFor(c.otherName, c.otherProgramName),
        }))
      : [];

  // No example conversations for an account that has just signed up (D-361).
  const useExamples = real.length === 0 && USE_DUMMY_PEOPLE && !isFreshAccount() && state.status !== 'loading';
  const examples: MessageRow[] = useExamples
    ? dummyConversationsFor(role).map((c) => {
        const other = DUMMY_ANYONE.find((p) => p.id === c.otherId) ?? null;
        return {
          id: c.id,
          name: other?.firstName ?? t('messages.thread.someone'),
          context: contextFor(role, other ? { role: other.role, programName: other.orgName ?? null } : null, t),
          preview: c.preview ? preview(c.preview.body, c.preview.mine) : t('messages.preview.none'),
          when: c.lastMessageAt ? whenHappened(c.lastMessageAt, locale, t) : null,
          unread: c.unread,
          href: `/messages/thread/?id=${encodeURIComponent(c.id)}`,
          photoUrl: staffPhotoFor(other?.firstName, other?.orgName),
        };
      })
    : [];

  return (
    <>
      {picking ? (
        <NewMessagePickerLazy
          isOpen={picking}
          onOpenChange={setPicking}
          people={useExamplePeople ? (pickerExamples?.people ?? []) : realPeople}
          onPick={pick}
        />
      ) : null}
      <MessagesView
        rows={useExamples ? examples : real}
        // Said for who is reading (D-363): there is no "list below" yet for
        // somebody new, so the line says what will fill this screen.
        emptyBody={t(
          role === 'member'
            ? 'messages.empty.body.member'
            : role === 'provider'
              ? 'messages.empty.body.provider'
              : role === 'admin'
                ? 'messages.empty.body.admin'
                : 'messages.empty.body.staff',
        )}
        headerActions={<HeaderActions role={viewedRole} enabled={session.status === 'signed-in'} hasHelp={false} />}
        note={useExamples ? t('example.people.note') : null}
        {...(canMessage ? { onNewMessage: () => setPicking(true) } : {})}
        // A member's people, one tap away (Will, 3 October, D-246): the same
        // strip a case manager's Home floats for Invite someone.
        floating={
          role === 'member' ? (
            <FloatingAction
              // One line (Will, 7 October, D-336): who they are, said once.
              label={t('messages.connections')}
              href="/connections/"
              icon={<ConnectionsIcon width={26} height={26} aria-hidden />}
            />
          ) : undefined
        }
      />
    </>
  );
}
