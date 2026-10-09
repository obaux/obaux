'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loading, Notice, Page } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../../NotIn';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useThread } from '@/lib/useThread';
import { ThreadViewLazy } from '../ThreadViewLazy';
import { staffPhotoFor } from '@pam/config/dummy-connections';
import { ThreadFrame, ThreadHeader, ThreadTop } from '../ThreadFrame';
import { DemoThreadLazy } from '../DemoThreadLazy';
import { ThreadVisit } from '../ThreadVisit';
import { threadLineFor } from '@/lib/threadLine';

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
 * `ThreadFrame` (D-192): the nested-page template's header, as on every
 * screen you tap into (D-213, D-411), pinned
 * at the top, the composer pinned at the bottom, only the messages
 * scrolling. No help link on this screen (A14, D-194): back leads to
 * Messages, which has one. One primary action: the 48px send button (A13). Reporting (D-177) and the
 * program's details are on the ⋯ page at the top right (D-213).
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
  // Opened from a program's page (D-313): Back returns there, so a member
  // can ask a question and go straight back to booking.
  const fromPlaceId = params.get('from') === 'place' ? params.get('place') : null;
  const backHref = fromPlaceId ? `/place/?id=${encodeURIComponent(fromPlaceId)}` : '/messages/';
  const backLabel = fromPlaceId ? t('nav.back.program') : t('nav.back.messages');
  const demo = isDummyId(conversationId);

  const signedIn = session.status === 'signed-in';
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  // The super admin messages staff too (0072, D-262) — never a member; the
  // database holds that line, not this screen.
  const realCanMessage =
    trueRole === 'member' || trueRole === 'admin' || trueRole === 'provider' || trueRole === 'super_admin';
  const viewedCanMessage =
    viewedRole === 'member' || viewedRole === 'admin' || viewedRole === 'provider' || viewedRole === 'super_admin';
  // A real thread runs as the real account (D-171); an example thread is
  // drawn for whichever role is being previewed and touches nothing real.
  const canMessage = demo ? viewedCanMessage : realCanMessage;

  const { state, send, sending, sendFailed } = useThread(signedIn && realCanMessage && !demo ? conversationId : null);

  const speechLanguage = locale === 'es' ? 'es-US' : 'en-US';

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <SubPageHeader title={t('messages.title')} backHref={backHref} backLabel={backLabel} />
        <NotIn status={session.status} title={t('messages.signedOut.title')} body={t('messages.signedOut.body')} />
      </Page>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        <SubPageHeader title={t('messages.title')} backHref={backHref} backLabel={backLabel} />
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

  if (!canMessage) {
    return (
      <Page gap={4}>
        <SubPageHeader title={t('messages.title')} backHref={backHref} backLabel={backLabel} />
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
        <DemoThreadLazy
          conversationId={conversationId}
          role={viewedRole ?? 'member'}
          speechLanguage={speechLanguage}
          supportPhone={supportPhone}
          backHref={backHref}
          backLabel={backLabel}
        />
      </ThreadFrame>
    );
  }

  const title = state.status === 'ready' ? (state.otherName ?? t('messages.thread.someone')) : t('messages.title');
  // What the name alone cannot say (D-187, D-395): the line under it — "Case
  // manager", or "Program lead at …" with the program's whole name; staff
  // looking at a member see nothing.
  const context =
    state.status === 'ready'
      ? threadLineFor(trueRole, { role: state.otherRole, programName: state.otherProgramName }, t)
      : null;

  if (state.status === 'ready') {
    return (
      <ThreadFrame>
        <ThreadTop>
          <ThreadHeader
            name={title}
            context={context}
            backHref={backHref}
            backLabel={backLabel}
            menuHref={`/messages/thread/options/?id=${encodeURIComponent(conversationId ?? '')}`}
          />
          {/* A member's visit with this program, under the name (D-276). */}
          {trueRole === 'member' && state.otherRole === 'provider' ? (
            <ThreadVisit programName={state.otherProgramName ?? null} threadId={conversationId ?? ''} />
          ) : null}
        </ThreadTop>
        <ThreadViewLazy
          messages={state.messages}
          otherName={state.otherName}
          otherPhotoUrl={staffPhotoFor(state.otherName, state.otherProgramName ?? null)}
          onSend={send}
          sending={sending}
          sendFailed={sendFailed}
          speechLanguage={speechLanguage}
          supportPhone={supportPhone}
        />
      </ThreadFrame>
    );
  }

  return (
    <Page gap={4}>
      <SubPageHeader title={title} backHref={backHref} backLabel={backLabel} />

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
          <Loading label="" variant="screen" />
        </Page>
      }
    >
      <ThreadScreen />
    </Suspense>
  );
}
