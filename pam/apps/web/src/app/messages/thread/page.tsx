'use client';

import { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppHeader, Loading, Notice, Page, PageTitle } from '@pam/ui';
import { NOTICES, type MessageReportReason } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../../NotIn';
import { HeaderBell } from '../../HeaderBell';
import { RoleSwitchControl } from '../../RoleSwitchControl';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useThread } from '@/lib/useThread';
import { reportMessage } from '@/lib/reportMessage';
import { ThreadViewLazy } from '../ThreadViewLazy';
import { ThreadFrame, ThreadHeader, ThreadTop } from '../ThreadFrame';
import { DemoThreadLazy } from '../DemoThreadLazy';

/**
 * One conversation — read what has been said, and send the next thing.
 *
 * Messaging is staff-to-member (D-163, D-176): a member, their case manager,
 * or their program admin can all land here, and all three read this screen
 * the same way — `useThread` checks conversation *membership*, never role.
 * A case manager who is themselves a participant reads the full history the
 * ordinary way any conversation member does (§4.1's transparency contract
 * says so — `transparency.canSee.directMessages`). What has not changed is
 * D-074: a case manager who is *not* in a conversation still has no route
 * into it except a report, because there is still no `admin_covers` policy
 * on `messages` anywhere — this screen only ever renders what
 * `in_conversation()` already allows.
 *
 * Drawn with Astryx's Chat family through `ThreadView` (D-181), inside
 * `ThreadFrame` (D-192): the app header and a one-row thread header pinned
 * at the top, the composer pinned at the bottom, only the messages
 * scrolling. No help link on this screen (A14, D-194): back leads to
 * Messages, which has one. One primary action: the 48px send button (A13). Reporting a message (D-177) is a secondary action
 * on the other person's messages, inside `ThreadView`.
 *
 * **An example conversation** (`?id=dummy-conv-…`, D-180) — what a super
 * admin's role preview opens from `/messages/`'s example rows — renders
 * through `DemoThreadLazy` instead: the same `ThreadView`, fed from
 * `DUMMY_THREADS` and a session-only store, never from `useThread`, never
 * inserting a real row. Gated on the previewed role, the way `/messages/`
 * itself is (D-172); a real thread is gated on the real one.
 */

function isDummyId(id: string | null): boolean {
  return id !== null && id.startsWith('dummy-conv-');
}

function ThreadScreen() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const params = useSearchParams();
  const conversationId = params.get('id');
  const demo = isDummyId(conversationId);

  const signedIn = session.status === 'signed-in';
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole, setViewAs } = useRoleView(trueRole);
  const realCanMessage = trueRole === 'member' || trueRole === 'admin' || trueRole === 'provider';
  const viewedCanMessage = viewedRole === 'member' || viewedRole === 'admin' || viewedRole === 'provider';
  // A real thread runs as the real account (D-171); an example thread is
  // drawn for whichever role is being previewed and touches nothing real.
  const canMessage = demo ? viewedCanMessage : realCanMessage;

  const { state, send, sending, sendFailed } = useThread(signedIn && realCanMessage && !demo ? conversationId : null);

  const report = useCallback(
    (messageId: string, reason: MessageReportReason) => reportMessage(messageId, reason),
    [],
  );

  const speechLanguage = locale === 'es' ? 'es-US' : 'en-US';

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <AppHeader />
        <PageTitle title={t('messages.title')} backHref="/messages/" backLabel={t('nav.back.messages')} />
        <NotIn status={session.status} title={t('messages.signedOut.title')} body={t('messages.signedOut.body')} />
      </Page>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        <AppHeader />
        <PageTitle title={t('messages.title')} backHref="/messages/" backLabel={t('nav.back.messages')} />
        <Notice
          notice={key}
          title={t(NOTICES[key].titleKey)}
          body={t(NOTICES[key].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      </Page>
    );
  }

  const header = (
    <AppHeader
      roleLabel={t(`role.${viewedRole}`)}
      roleControl={<RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />}
      trailing={<HeaderBell enabled={signedIn} role={viewedRole} />}
    />
  );

  if (!canMessage) {
    return (
      <Page gap={4}>
        {header}
        <PageTitle title={t('messages.title')} backHref="/messages/" backLabel={t('nav.back.messages')} />
        <Notice
          notice="no_mentors_found"
          title={t('messages.notForRole.title')}
          body={t('messages.notForRole.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      </Page>
    );
  }

  if (demo && conversationId) {
    // `DemoThreadLazy` draws its own `ThreadHeader` inside the pinned block
    // (it knows the pair) and the same `ThreadView` as a real thread.
    return (
      <ThreadFrame>
        <ThreadTop>{header}</ThreadTop>
        <DemoThreadLazy
          conversationId={conversationId}
          role={viewedRole ?? 'member'}
          speechLanguage={speechLanguage}
          supportPhone={supportPhone}
        />
      </ThreadFrame>
    );
  }

  const title = state.status === 'ready' ? (state.otherName ?? t('messages.thread.someone')) : t('messages.title');
  // What the name alone cannot say (D-187): a member sees "Case manager" or
  // the program's name beside it; staff looking at a member see nothing.
  const context =
    state.status === 'ready' && trueRole === 'member'
      ? state.otherRole === 'provider'
        ? (state.otherProgramName ?? t('role.provider'))
        : state.otherRole === 'admin'
          ? t('role.admin')
          : null
      : null;

  if (state.status === 'ready') {
    return (
      <ThreadFrame>
        <ThreadTop>
          {header}
          <ThreadHeader
            name={title}
            context={context}
            backHref="/messages/"
            backLabel={t('nav.back.messages')}
          />
        </ThreadTop>
        <ThreadViewLazy
          messages={state.messages}
          otherName={state.otherName}
          onSend={send}
          sending={sending}
          sendFailed={sendFailed}
          onReport={report}
          speechLanguage={speechLanguage}
          supportPhone={supportPhone}
        />
      </ThreadFrame>
    );
  }

  return (
    <Page gap={4}>
      {header}
      <PageTitle title={title} backHref="/messages/" backLabel={t('nav.back.messages')} />

      {state.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

      {state.status === 'not_found' ? (
        <Notice
          notice="service_not_available"
          title={t('messages.thread.notFound.title')}
          body={t('messages.thread.notFound.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {state.status === 'error' ? (
        <Notice
          notice={state.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}
    </Page>
  );
}

/**
 * `useSearchParams` needs a Suspense boundary in an exported app — see
 * `/flag/page.tsx` for the same shape and why the fallback is a real header
 * rather than a spinner.
 */
export default function MessageThreadPage() {
  return (
    <Suspense
      fallback={
        <Page gap={3}>
          <AppHeader />
        </Page>
      }
    >
      <ThreadScreen />
    </Suspense>
  );
}
