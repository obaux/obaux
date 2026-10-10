'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import {
  DUMMY_REPORTS,
  dummyPickerFor,
  type DummyMessagingRole,
} from '@pam/config/dummy-conversations';
import { DUMMY_ANYONE, type DummyPerson } from '@pam/config/dummy-people';
import type { Role } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { ReportsList } from './ReportsList';
import type { PickablePerson } from './NewMessagePicker';

/**
 * Example reports, the example picker and the context lines — what
 * `/messages/` shows a super admin previewing a role (D-184, D-186). The example
 * conversations themselves come from `MessagesScreen`.
 *
 * Loaded only through `DummyRowsLazy` (`next/dynamic`).
 */

const styles = stylex.create({
  note: { fontSize: '15px', lineHeight: 1.5 },
});

function person(id: string): DummyPerson | null {
  return DUMMY_ANYONE.find((p) => p.id === id) ?? null;
}

/** The context line under a name (D-187): the other person's role, said the way this viewer needs it. */
export function contextFor(
  viewer: Role,
  other: { readonly role: Role; readonly programName: string | null } | null,
  t: (key: string) => string,
): string | null {
  if (!other) return null;
  // The person running Pam, to the staff they help (D-262).
  if (other.role === 'super_admin') return t('role.pamTeam');
  // The super admin talks only to staff, and needs to know which kind.
  if (viewer === 'super_admin') return pickerContextFor(other, t);
  if (viewer !== 'member') return null;
  if (other.role === 'provider') return other.programName ?? t('role.provider');
  if (other.role === 'admin') return t('role.admin');
  return null;
}

/**
 * The line under a name in the new-message picker (Will, 3 October): who
 * this is — Member, Case manager, or Program with its name when known.
 * Unlike `contextFor` it is never empty, because first names alone do not
 * say who is who. Who appears is `messageable_people()`'s rule: a case
 * manager or a program sees members; a member sees their case manager and
 * programs — so each viewer only ever meets the labels that apply.
 */
export function pickerContextFor(
  other: { readonly role: Role; readonly programName: string | null },
  t: (key: string) => string,
): string {
  if (other.role === 'provider' && other.programName) return `${t('role.provider')} · ${other.programName}`;
  return t(`role.${other.role}`);
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
  role: DummyMessagingRole,
  t: (key: string) => string,
): { readonly people: readonly PickablePerson[]; readonly hrefFor: (id: string) => string } {
  const entries = dummyPickerFor(role);
  const people = entries
    .map((e): PickablePerson | null => {
      const p = person(e.personId);
      return p
        ? {
            id: e.personId,
            name: p.firstName,
            context: pickerContextFor({ role: p.role, programName: p.orgName ?? null }, t),
          }
        : null;
    })
    .filter((p): p is PickablePerson => p !== null);
  const byId = new Map(entries.map((e) => [e.personId, e.conversationId]));
  return {
    people,
    hrefFor: (id) => `/messages/thread/?id=${encodeURIComponent(byId.get(id) ?? '')}`,
  };
}
