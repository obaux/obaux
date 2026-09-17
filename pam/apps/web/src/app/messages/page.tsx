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
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { HeaderBell } from '../HeaderBell';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../RoleSwitchControl';
import { useConversations } from '@/lib/useConversations';
import { useMessageableMembers } from '@/lib/useMessageableMembers';
import { whenHappened } from '@/lib/when';
import { StartConversationRow } from './StartConversationRow';

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
 * **Not previewable**, for the same reason D-150 gave and which still holds
 * for all three roles now, not just member: whichever of the three roles is
 * previewing would otherwise be reading and sending *real* messages under
 * their own real account. Every check below reads `session.session.role`
 * directly, never `viewedRole`'s preview.
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
  const { viewedRole, setViewAs } = useRoleView(trueRole);
  const canMessage = trueRole === 'member' || trueRole === 'admin' || trueRole === 'provider';
  const isStaff = trueRole === 'admin' || trueRole === 'provider';

  const { state: conversations } = useConversations(signedIn && canMessage);
  const { state: messageable } = useMessageableMembers(
    signedIn && isStaff,
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
        trailing={<HeaderBell enabled={signedIn} role={viewedRole} />}
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

      {canMessage && conversations.status === 'loading' ? (
        <Loading label={t('common.loading')} variant="inline" />
      ) : null}

      {canMessage && conversations.status === 'error' ? (
        <Notice
          notice={conversations.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[conversations.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[conversations.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {canMessage && (conversations.status === 'empty' || conversations.status === 'ready') ? (
        <VStack gap={3}>
          {conversations.status === 'ready' && conversations.conversations.length > 0 ? (
            conversations.conversations.map((c) => (
              <ConversationRowView
                key={c.id}
                otherName={c.otherName}
                otherRoleLabel={c.otherRole ? t(`role.${c.otherRole}`) : null}
                when={c.lastMessageAt ? whenHappened(c.lastMessageAt, locale, t) : null}
                unread={c.unread}
                href={`/messages/thread/?id=${encodeURIComponent(c.id)}`}
                labels={rowLabels}
              />
            ))
          ) : (
            <Notice
              notice="no_mentors_found"
              title={t('messages.empty.title')}
              body={t(isStaff ? 'messages.empty.body.staff' : 'messages.empty.body.member')}
            />
          )}
        </VStack>
      ) : null}

      {isStaff ? (
        <VStack gap={2}>
          <Heading level={2} xstyle={styles.section}>
            {t('messages.start.title')}
          </Heading>

          {messageable.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

          {messageable.status === 'error' ? (
            <Notice
              notice={messageable.offline ? 'offline' : 'something_went_wrong'}
              title={t(NOTICES[messageable.offline ? 'offline' : 'something_went_wrong'].titleKey)}
              body={t(NOTICES[messageable.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
              supportPhone={supportPhone}
              callLabel={t('help.callSupport')}
            />
          ) : null}

          {messageable.status === 'ready' && startable.length === 0 ? (
            <Notice
              notice="no_caseload_members"
              title={t('messages.start.empty.title')}
              body={t('messages.start.empty.body')}
            />
          ) : null}

          {startable.length > 0 ? (
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
        </VStack>
      ) : null}

      <HelpBar label={t('nav.help')} variant="block" />
    </Page>
  );
}
