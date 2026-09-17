'use client';

import { useMemo } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import { AppHeader, HelpBar, Loading, Notice, Page, PageTitle } from '@pam/ui';
import { NOTICES } from '@pam/config';
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
import { whenHappened } from '@/lib/when';
import { StartConversationRow } from './StartConversationRow';
import { DummyConversationsLazy, DummyStartableLazy } from './DummyRowsLazy';

/**
 * Who a case manager or a program admin can message, who a member has
 * already been messaged by, and every conversation any of the three already
 * have.
 *
 * **Messaging in PAM is staff-to-member, not member-to-member.** An earlier
 * version of this screen scoped "who can you message" to accepted
 * mentor/buddy `connections` — wrong, corrected on Will's direction (see
 * D-152, superseding D-148/D-149/D-150). A1's own reasoning already said the
 * quiet part: staff reaching a member has to go through the relationship
 * that already exists — a case manager's caseload, a program's enrollment —
 * never an open directory.
 *
 * Who may *start* a new conversation, and with whom:
 *
 *   - A **case manager** (`role: 'admin'`) sees their caseload — the same
 *     people `/admin/`'s "Your people" screen shows, via `admin_covers()`.
 *   - A **program admin** (`role: 'provider'`) sees members enrolled in a
 *     service under their org, via `provider_linked_to()`.
 *   - A **member** starts nothing. They see only conversations already begun
 *     with them, and can reply inside one — no "Start a conversation"
 *     section renders for a member at all.
 *
 * **Preview-aware, but real data never follows the preview (D-172).**
 * Visibility of every section below — whether this screen shows anything at
 * all, whether the "Start a conversation" list appears — is gated on
 * `viewedRole`, the same as every other screen a super admin can preview
 * (`/admin/`, `/directory/`, `/interested/`). Before D-172 this screen was
 * the one exception, gated on `trueRole` alone, which meant the Home tile
 * and this screen simply never showed during any preview — a real bug, not
 * a deliberate restriction (Will, 17 September).
 *
 * What D-150's original worry still correctly rules out: reading or sending
 * a *real* message under a previewed identity. That is why `useConversations`
 * and `useMessageableMembers` below are still enabled only by `trueRole` —
 * the real, signed-in account's own true permissions, never `viewedRole`.
 * A super admin previewing "Case manager" sees this screen's chrome and
 * layout, but the data behind it is still queried as themselves, under
 * D-171 ("a super admin cannot send or start any message") — which for a
 * super admin's own real account means no real conversations and no real
 * "who can I message" list ever load here, preview or not.
 *
 * What fills the gap: `DummyConversationsLazy`/`DummyStartableLazy`
 * (`@pam/config/dummy-conversations`), the same "real always wins, silently"
 * fallback `/admin/` already uses for `DUMMY_MEMBERS` — shown whenever a
 * preview is active, or whenever the real, non-previewed account's own real
 * list comes back genuinely empty. Every dummy row is plain, non-interactive
 * markup with no `href` and no `onClick` — seeing example content is safe;
 * a tap that could reach `openConversation` would not be. See the file
 * comment in `dummy-conversations.ts` and D-172 for why.
 */

const styles = stylex.create({
  row: { width: '100%', position: 'relative' },
  name: { fontSize: '20px', lineHeight: 1.3 },
  meta: { fontSize: '16px' },
  section: { fontSize: '17px' },
  link: {
    color: 'inherit',
    textDecoration: 'none',
    '::after': { content: '""', position: 'absolute', inset: 0 },
  },
});

function ConversationRowView({
  otherName,
  otherRoleLabel,
  when,
  unread,
  href,
  labels,
}: {
  readonly otherName: string | null;
  readonly otherRoleLabel: string | null;
  readonly when: string | null;
  readonly unread: boolean;
  readonly href: string;
  readonly labels: { readonly someone: string; readonly new: string };
}) {
  const name = otherName ?? labels.someone;
  return (
    <Card xstyle={styles.row}>
      <VStack gap={2}>
        <HStack gap={3} align="center">
          <Avatar size="lg" name={name} />
          <Heading level={3} xstyle={styles.name}>
            <a href={href} {...stylex.props(styles.link)}>
              {name}
            </a>
          </Heading>
        </HStack>
        <HStack gap={2} wrap="wrap" align="center">
          {otherRoleLabel ? <Badge variant="neutral" label={otherRoleLabel} /> : null}
          {unread ? <Badge variant="info" label={labels.new} /> : null}
          {when ? (
            <Text type="supporting" xstyle={styles.meta}>
              {when}
            </Text>
          ) : null}
        </HStack>
      </VStack>
    </Card>
  );
}

export default function MessagesPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const signedIn = session.status === 'signed-in';
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole, demoRole, setViewAs } = useRoleView(trueRole);
  const isDemo = useDemoView(session);
  // A preview is active, or the account is in the separate demo-view grant
  // (0057) — either way, real data is not what this screen should draw.
  const previewing = demoRole !== null || isDemo;

  // Visibility/rendering — what this screen draws — follows the previewed
  // role, the same as every other previewable screen (D-172).
  const canMessage = viewedRole === 'member' || viewedRole === 'admin' || viewedRole === 'provider';
  const isStaff = viewedRole === 'admin' || viewedRole === 'provider';

  // Real data fetched, and the only account any real write below could ever
  // run as, always follows the TRUE role, never the preview (D-171, D-172).
  // For a super admin (the only account that can ever be previewing),
  // `trueRole` is never in the list below, so these two hooks simply never
  // run while a preview is active — not merely "run and come back empty".
  const realCanMessage = trueRole === 'member' || trueRole === 'admin' || trueRole === 'provider';
  const realIsStaff = trueRole === 'admin' || trueRole === 'provider';

  const { state: conversations } = useConversations(signedIn && realCanMessage);
  const { state: messageable } = useMessageableMembers(
    signedIn && realIsStaff,
    trueRole === 'admin' || trueRole === 'provider' ? trueRole : null,
  );

  const messagedIds = useMemo(() => {
    if (conversations.status !== 'ready') return new Set<string>();
    return new Set(
      conversations.conversations
        .map((c) => c.otherProfileId)
        .filter((id): id is string => id !== null),
    );
  }, [conversations]);

  const startable = useMemo(() => {
    if (messageable.status !== 'ready') return [];
    return messageable.people.filter((p) => !messagedIds.has(p.profileId));
  }, [messageable, messagedIds]);

  const rowLabels = { someone: t('messages.thread.someone'), new: t('notify.new') };

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

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={t(`role.${viewedRole}`)}
        roleControl={<RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />}
        trailing={<HeaderBell enabled={signedIn} role={viewedRole} isDemo={isDemo} />}
      />

      <PageTitle title={t('messages.title')} backHref="/" backLabel={t('nav.back.home')} />

      {!canMessage ? (
        <Notice
          notice="no_mentors_found"
          title={t('messages.notForRole.title')}
          body={t('messages.notForRole.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {/*
        Real conversations: only for the real, non-previewed account, and
        only while its real query is actually running (`realCanMessage`).
        A preview never reaches loading/error/empty here at all — see
        `previewing` above — so there is nothing to show while it is active
        except the dummy section below.
      */}
      {canMessage && !previewing && realCanMessage && conversations.status === 'loading' ? (
        <Loading label={t('common.loading')} variant="inline" />
      ) : null}

      {canMessage && !previewing && conversations.status === 'error' ? (
        <Notice
          notice={conversations.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[conversations.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[conversations.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {canMessage && !previewing && conversations.status === 'ready' && conversations.conversations.length > 0 ? (
        <VStack gap={3}>
          {conversations.conversations.map((c) => (
            <ConversationRowView
              key={c.id}
              otherName={c.otherName}
              otherRoleLabel={c.otherRole ? t(`role.${c.otherRole}`) : null}
              when={c.lastMessageAt ? whenHappened(c.lastMessageAt, locale, t) : null}
              unread={c.unread}
              href={`/messages/thread/?id=${encodeURIComponent(c.id)}`}
              labels={rowLabels}
            />
          ))}
        </VStack>
      ) : null}

      {/*
        The real, non-previewed account's own list is genuinely empty, and
        example content is turned off (`USE_DUMMY_PEOPLE`) — the plain empty
        state, same wording as before D-172.
      */}
      {canMessage && !previewing && !USE_DUMMY_PEOPLE && conversations.status === 'empty' ? (
        <Notice
          notice="no_mentors_found"
          title={t('messages.empty.title')}
          body={t(isStaff ? 'messages.empty.body.staff' : 'messages.empty.body.member')}
        />
      ) : null}

      {/*
        Example conversations (D-172): a preview is active, or the real
        account's own real list came back genuinely empty — the same
        "real always wins, silently" rule `/admin/` already applies to
        `DUMMY_MEMBERS`. Never interactive; see `DummyRowsLazy`.
      */}
      {canMessage &&
      USE_DUMMY_PEOPLE &&
      (previewing || conversations.status === 'empty') &&
      (viewedRole === 'member' || viewedRole === 'admin' || viewedRole === 'provider') ? (
        <DummyConversationsLazy role={viewedRole} />
      ) : null}

      {isStaff ? (
        <VStack gap={2}>
          <Heading level={2} xstyle={styles.section}>
            {t('messages.start.title')}
          </Heading>

          {!previewing && realIsStaff && messageable.status === 'loading' ? (
            <Loading label={t('common.loading')} variant="inline" />
          ) : null}

          {!previewing && messageable.status === 'error' ? (
            <Notice
              notice={messageable.offline ? 'offline' : 'something_went_wrong'}
              title={t(NOTICES[messageable.offline ? 'offline' : 'something_went_wrong'].titleKey)}
              body={t(NOTICES[messageable.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
              supportPhone={supportPhone}
              callLabel={t('help.callSupport')}
            />
          ) : null}

          {!previewing && !USE_DUMMY_PEOPLE && messageable.status === 'ready' && startable.length === 0 ? (
            <Notice
              notice="no_caseload_members"
              title={t('messages.start.empty.title')}
              body={t('messages.start.empty.body')}
            />
          ) : null}

          {/*
            Real, tappable rows — only for the real, non-previewed account.
            Each one is a live `openConversation` call; never rendered while
            `previewing` (D-172).
          */}
          {!previewing && startable.length > 0 ? (
            <VStack gap={3}>
              {startable.map((person) => (
                <StartConversationRow
                  key={person.profileId}
                  profileId={person.profileId}
                  firstName={person.firstName}
                  labels={{
                    someone: rowLabels.someone,
                    failedTitle: t('messages.start.failed.title'),
                    failedBody: t('messages.start.failed.body'),
                    callSupport: t('help.callSupport'),
                  }}
                  supportPhone={supportPhone}
                />
              ))}
            </VStack>
          ) : null}

          {/*
            Example people to message (D-172): a preview, or the real
            account's own real "Start a conversation" list came back
            genuinely empty. Non-interactive — see `DummyRowsLazy`.
          */}
          {USE_DUMMY_PEOPLE &&
          (viewedRole === 'admin' || viewedRole === 'provider') &&
          (previewing || (messageable.status === 'ready' && startable.length === 0)) ? (
            <DummyStartableLazy role={viewedRole} />
          ) : null}
        </VStack>
      ) : null}

      <HelpBar label={t('nav.help')} variant="block" />
    </Page>
  );
}
