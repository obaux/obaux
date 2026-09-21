'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { List } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { AppHeader, BigButton, Loading, Notice, Page, PageTitle } from '@pam/ui';
import { NOTICES, type Role } from '@pam/config';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { HeaderBell } from '../HeaderBell';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useDemoView } from '@/lib/useDemoView';
import { RoleSwitchControl } from '../RoleSwitchControl';
import { useConversations } from '@/lib/useConversations';
import { useMessageableMembers } from '@/lib/useMessageableMembers';
import { useReports } from '@/lib/useReports';
import { openConversation } from '@/lib/openConversation';
import { whenHappened } from '@/lib/when';
import { ConversationRow } from './ConversationRow';
import { ReportsList } from './ReportsList';
import { DummyConversationsLazy, DummyReportsLazy } from './DummyRowsLazy';
import { NewMessagePickerLazy } from './NewMessagePickerLazy';
import type { PickablePerson } from './NewMessagePicker';

/**
 * Messages: every conversation this person is in, and — for a case manager
 * or a super admin — the messages somebody said were not safe.
 *
 * **Messaging in PAM is staff-to-member, not member-to-member** (D-163,
 * D-176): a case manager and the members on their caseload, a program admin
 * and the members enrolled with them, in either direction. `messageable_people()`
 * (0063) is the list and `open_direct_conversation()` is the rule, so a name
 * offered here is one the database will open and nothing else can be opened.
 *
 * **Two sections, one control** (D-184). A member or a program sees their
 * conversations. A case manager sees conversations and "Reported"; a super
 * admin sees "Reported" only — D-171: a super admin has no conversations
 * and no way to start one, so no "New message" is drawn for them. The
 * bell's "a message from … was reported" lands on `?show=reported`.
 *
 * **One primary action**: "New message" (D-186), which opens a picker of
 * everyone this person may reach, with a search box. The people-card list
 * that used to sit under the conversations is gone.
 *
 * **Preview-aware, but real data never follows the preview (D-172).** What
 * is drawn follows `viewedRole`; `useConversations`, `useMessageableMembers`
 * and `useReports` are enabled by `trueRole` only. A preview, or a genuinely
 * empty real list, shows the example set (D-183, D-184) through the same
 * row components the real data uses.
 */

const styles = stylex.create({
  note: { fontSize: '15px', lineHeight: 1.5 },
  // The title as the switcher (D-197): the page-title scale, 48px to hit,
  // and no button chrome until it is pressed — it reads as the title.
  titleButton: { fontSize: '28px', lineHeight: 1.2, minHeight: '48px', paddingInline: 0, fontWeight: 700 },
});

type Section = 'conversations' | 'reported';

function contextFor(
  viewer: Role | null,
  otherRole: Role | null,
  programName: string | null,
  t: (key: string) => string,
): string | null {
  if (viewer !== 'member' || !otherRole) return null;
  if (otherRole === 'provider') return programName ?? t('role.provider');
  if (otherRole === 'admin') return t('role.admin');
  return null;
}

function MessagesScreen() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const params = useSearchParams();

  const signedIn = session.status === 'signed-in';
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole, demoRole, setViewAs } = useRoleView(trueRole);
  const isDemo = useDemoView(session);
  const previewing = demoRole !== null || isDemo;

  // What is drawn follows the previewed role (D-172).
  const canMessage = viewedRole === 'member' || viewedRole === 'admin' || viewedRole === 'provider';
  const canReview = viewedRole === 'admin' || viewedRole === 'super_admin';
  const hasScreen = canMessage || canReview;

  // What is fetched follows the true role, never the preview (D-171, D-172).
  const realCanMessage = trueRole === 'member' || trueRole === 'admin' || trueRole === 'provider';
  const realCanReview = trueRole === 'admin' || trueRole === 'super_admin';

  const { state: conversations } = useConversations(signedIn && realCanMessage);
  const { state: messageable } = useMessageableMembers(signedIn && realCanMessage);
  const { state: reports } = useReports(signedIn && realCanReview);

  const [chosen, setChosen] = useState<Section>('conversations');
  // `?show=reported` is where the bell's row lands (D-185). Read in an
  // effect, not the initialiser: in a static export the params arrive after
  // the first render.
  useEffect(() => {
    if (params.get('show') === 'reported') setChosen('reported');
  }, [params]);
  // A super admin has no conversations to show, so Reported is their only
  // section; anyone who cannot review only has Conversations.
  const section: Section = viewedRole === 'super_admin' ? 'reported' : canReview ? chosen : 'conversations';
  const setSection = setChosen;

  const [picking, setPicking] = useState(false);
  const [dummyPicker, setDummyPicker] = useState<{
    people: readonly PickablePerson[];
    hrefFor: (id: string) => string;
  } | null>(null);

  const realPeople = useMemo<readonly PickablePerson[]>(() => {
    if (messageable.status !== 'ready') return [];
    return messageable.people.map((p) => ({
      id: p.profileId,
      name: p.firstName ?? t('messages.thread.someone'),
      context: contextFor(trueRole, p.role, null, t),
    }));
  }, [messageable, trueRole, t]);

  // The example cast for a preview, loaded with the picker rather than the page.
  useEffect(() => {
    if (!picking || !previewing || !canMessage) return;
    let cancelled = false;
    void import('./DummyRows').then((mod) => {
      if (cancelled) return;
      setDummyPicker(mod.dummyPickerPeople(viewedRole as 'member' | 'admin' | 'provider', t));
    });
    return () => {
      cancelled = true;
    };
  }, [picking, previewing, canMessage, viewedRole, t]);

  const pick = useCallback(
    async (id: string): Promise<string | null> => {
      if (previewing) return dummyPicker ? dummyPicker.hrefFor(id) : null;
      const conversationId = await openConversation(id);
      return conversationId ? `/messages/thread/?id=${encodeURIComponent(conversationId)}` : null;
    },
    [previewing, dummyPicker],
  );

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
        <PageTitle title={t('messages.title')} backHref="/" backLabel={t('nav.back.home')} />
        <NotIn status={session.status} title={t('messages.signedOut.title')} body={t('messages.signedOut.body')} />
      </Page>
    );
  }

  const showConversations = canMessage && section === 'conversations';
  const showReported = canReview && section === 'reported';
  const realEmptyConversations = !previewing && conversations.status === 'empty';
  const realEmptyReports = !previewing && reports.status === 'ready' && reports.reports.length === 0;

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={t(`role.${viewedRole}`)}
        roleControl={<RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />}
        trailing={<HeaderBell enabled={signedIn} role={viewedRole} isDemo={isDemo} />}
      />

      {/*
        The title is the section switcher for a case manager (D-197): it reads
        "Messages" or "Reported" with a chevron, and tapping it offers the
        other. A super admin has only Reported (D-171), so their title is the
        plain word; a member or a program has only conversations and gets
        "Messages" with no chevron.
      */}
      <PageTitle
        title={section === 'reported' ? t('messages.section.reported') : t('messages.title')}
        titleControl={
          canMessage && canReview ? (
            <DropdownMenu
              button={{
                label: section === 'reported' ? t('messages.section.reported') : t('messages.title'),
                variant: 'ghost',
                size: 'lg',
                xstyle: styles.titleButton,
              }}
              items={[
                { id: 'conversations', label: t('messages.section.conversations'), onClick: () => setSection('conversations') },
                { id: 'reported', label: t('messages.section.reported'), onClick: () => setSection('reported') },
              ]}
              placement="below"
              alignment="start"
            />
          ) : undefined
        }
        backHref="/"
        backLabel={t('nav.back.home')}
      />

      {!hasScreen ? (
        <Notice
          notice="no_mentors_found"
          title={t('messages.notForRole.title')}
          body={t('messages.notForRole.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {/* ---- Conversations ---- */}

      {showConversations && !previewing && realCanMessage && conversations.status === 'loading' ? (
        <Loading label={t('common.loading')} variant="inline" />
      ) : null}

      {showConversations && !previewing && conversations.status === 'error' ? (
        <Notice
          notice={conversations.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[conversations.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[conversations.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {showConversations && !previewing && conversations.status === 'ready' && conversations.conversations.length > 0 ? (
        <List hasDividers density="spacious">
          {conversations.conversations.map((c) => (
            <ConversationRow
              key={c.id}
              name={c.otherName ?? t('messages.thread.someone')}
              context={contextFor(trueRole, c.otherRole, c.otherProgramName, t)}
              preview={
                c.lastMessageBody === null
                  ? t('messages.preview.none')
                  : c.lastMessageMine
                    ? t('messages.preview.you', { text: c.lastMessageBody })
                    : c.lastMessageBody
              }
              when={c.lastMessageAt ? whenHappened(c.lastMessageAt, locale, t) : null}
              unread={c.unread}
              unreadLabel={t('notify.new')}
              href={`/messages/thread/?id=${encodeURIComponent(c.id)}`}
            />
          ))}
        </List>
      ) : null}

      {showConversations && realEmptyConversations && !USE_DUMMY_PEOPLE ? (
        <Notice
          notice="no_mentors_found"
          title={t('messages.empty.title')}
          body={t(viewedRole === 'member' ? 'messages.empty.body.member' : 'messages.empty.body.staff')}
        />
      ) : null}

      {showConversations &&
      USE_DUMMY_PEOPLE &&
      (previewing || realEmptyConversations) &&
      (viewedRole === 'member' || viewedRole === 'admin' || viewedRole === 'provider') ? (
        <DummyConversationsLazy role={viewedRole} />
      ) : null}

      {/*
        The one primary action (D-186): everyone this person may message, in a
        sheet with a search box. Never for a super admin (D-171).
      */}
      {showConversations ? (
        <BigButton label={t('messages.new.action')} onPress={() => setPicking(true)} />
      ) : null}

      {picking ? (
        <NewMessagePickerLazy
          isOpen={picking}
          onOpenChange={setPicking}
          people={previewing ? (dummyPicker?.people ?? []) : realPeople}
          onPick={pick}
        />
      ) : null}

      {/* ---- Reported ---- */}

      {showReported && !previewing && realCanReview && reports.status === 'loading' ? (
        <Loading label={t('common.loading')} variant="inline" />
      ) : null}

      {showReported && !previewing && reports.status === 'error' ? (
        <Notice
          notice={reports.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[reports.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[reports.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {showReported && !previewing && reports.status === 'ready' && reports.reports.length > 0 ? (
        <ReportsList reports={reports.reports} />
      ) : null}

      {showReported && realEmptyReports && !USE_DUMMY_PEOPLE ? (
        <Notice notice="no_caseload_members" title={t('reports.empty.title')} body={t('reports.empty.body')} />
      ) : null}

      {showReported && USE_DUMMY_PEOPLE && (previewing || realEmptyReports) ? <DummyReportsLazy /> : null}

      {showReported ? (
        <Text type="supporting" xstyle={styles.note}>
          {t('reports.intro')}
        </Text>
      ) : null}

      {/*
        No help link on this screen (A15) — the fourth in PAM without one.
        The header's own mark is one tap back to Home, which always carries
        the HelpBar; this screen already carries the number on every failure
        state it can reach (conversations, reports).
      */}
    </Page>
  );
}

/** `useSearchParams` needs a Suspense boundary in an exported app (see `/place/`). */
export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <Page gap={3}>
          <AppHeader />
        </Page>
      }
    >
      <MessagesScreen />
    </Suspense>
  );
}
