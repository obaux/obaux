'use client';

import * as stylex from '@stylexjs/stylex';
import { List } from '@astryxdesign/core/List';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { DUMMY_REPORTS, dummyConversationsFor, dummyPickerFor } from '@pam/config/dummy-conversations';
import { DUMMY_EVERYONE, type DummyPerson } from '@pam/config/dummy-people';
import type { Role } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { whenHappened } from '@/lib/when';
import { ConversationRow } from './ConversationRow';
import { ReportsList } from './ReportsList';
import type { PickablePerson } from './NewMessagePicker';

/**
 * Example conversations, example reports and the example picker — what
 * `/messages/` shows a super admin previewing a role, or a real account
 * whose own real list is genuinely empty (D-172, D-183, D-184, D-186).
 *
 * Every row here opens an example thread and only an example thread:
 * `/messages/thread/?id=dummy-conv-…`, answered from `DUMMY_THREADS` plus a
 * session-only store — never `useThread`, never a real insert (D-180). The
 * rows are the same `ConversationRow` the real list uses.
 *
 * Loaded only through `DummyRowsLazy` (`next/dynamic`).
 */

const styles = stylex.create({
  note: { fontSize: '15px', lineHeight: 1.5 },
});

function person(id: string): DummyPerson | null {
  return DUMMY_EVERYONE.find((p) => p.id === id) ?? null;
}

/** The context line under a name (D-187): the other person's role, said the way this viewer needs it. */
export function contextFor(
  viewer: Role,
  other: { readonly role: Role; readonly programName: string | null } | null,
  t: (key: string) => string,
): string | null {
  if (!other || viewer !== 'member') return null;
  if (other.role === 'provider') return other.programName ?? t('role.provider');
  if (other.role === 'admin') return t('role.admin');
  return null;
}

function dummyContext(viewer: Role, other: DummyPerson | null, t: (key: string) => string): string | null {
  return contextFor(viewer, other ? { role: other.role, programName: other.orgName ?? null } : null, t);
}

export function DummyConversations({ role }: { readonly role: 'member' | 'admin' | 'provider' }) {
  const { t, locale } = useI18n();
  const rows = dummyConversationsFor(role);

  return (
    <VStack gap={2}>
      <List hasDividers density="spacious">
        {rows.map((c) => {
          const other = person(c.otherId);
          return (
            <ConversationRow
              key={c.id}
              name={other?.firstName ?? t('messages.thread.someone')}
              context={dummyContext(role, other, t)}
              preview={
                c.preview === null
                  ? t('messages.preview.none')
                  : c.preview.mine
                    ? t('messages.preview.you', { text: c.preview.body })
                    : c.preview.body
              }
              when={c.lastMessageAt ? whenHappened(c.lastMessageAt, locale, t) : null}
              unread={c.unread}
              unreadLabel={t('notify.new')}
              href={`/messages/thread/?id=${encodeURIComponent(c.id)}`}
            />
          );
        })}
      </List>
      <Text type="supporting" xstyle={styles.note}>
        {t('example.people.note')}
      </Text>
    </VStack>
  );
}

/** Reported messages, for a case manager or super admin preview (D-184). */
export function DummyReports() {
  const { t } = useI18n();
  return (
    <VStack gap={2}>
      <ReportsList
        reports={DUMMY_REPORTS.map((r) => {
          const about = person(r.aboutId);
          const reporter = person(r.reporterId);
          return {
            id: r.id,
            reason: r.reason,
            excerpt: r.excerpt,
            createdAt: r.createdAt,
            resolvedAt: r.resolvedAt,
            reporterName: reporter?.firstName ?? null,
            reporterRole: reporter?.role ?? 'member',
            aboutName: about?.firstName ?? null,
            aboutRole: about?.role ?? null,
          };
        })}
      />
      <Text type="supporting" xstyle={styles.note}>
        {t('example.people.note')}
      </Text>
    </VStack>
  );
}

/** Who a preview can pick in "New message", and where each pick goes (D-186). */
export function dummyPickerPeople(
  role: 'member' | 'admin' | 'provider',
  t: (key: string) => string,
): { readonly people: readonly PickablePerson[]; readonly hrefFor: (id: string) => string } {
  const entries = dummyPickerFor(role);
  const people = entries
    .map((e) => {
      const p = person(e.personId);
      return p ? { id: e.personId, name: p.firstName, context: dummyContext(role, p, t) } : null;
    })
    .filter((p): p is PickablePerson => p !== null);
  const byId = new Map(entries.map((e) => [e.personId, e.conversationId]));
  return {
    people,
    hrefFor: (id) => `/messages/thread/?id=${encodeURIComponent(byId.get(id) ?? '')}`,
  };
}
