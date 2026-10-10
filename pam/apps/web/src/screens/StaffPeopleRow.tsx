'use client';

import { useMemo } from 'react';
import type { RankedPerson } from '@pam/config/people-activity';
import { PeopleStrip, PeopleStripEmpty, type PeopleStripPerson } from '@pam/ui/PeopleStrip';
import { exampleRankedPeople } from '@/lib/exampleRankedPeople';
import { useExamplePeople } from '@/lib/examplePeople';
import { useI18n } from '@/lib/i18n';
import { useRankedPeople, type RankedPersonRow } from '@/lib/useRankedPeople';
import { useSession } from '@/lib/useSession';

/**
 * The people with something new, as a row of rings at the top of a case
 * manager's or program lead's Home (D-198, D-477, D-486): a ring on anyone who
 * has sent an unread message or saved a place since you last looked, those
 * people first, newest first. `useRankedPeople` is the ranking and the data
 * (`messageable_people`, conversations, `people_activity`), drawn by
 * `PeopleStrip`. A tap goes where it always went: an unread message opens the
 * conversation, anything else opens the person. No heading and no "see all":
 * the Home's own title says whose they are and the list is on the screen.
 *
 * With nobody on the list (D-486, Will, 10 October), a row of faint circles with
 * a (+) first that starts an invite: a case manager's for a member, a program
 * lead's their own flow. While the demo is on (D-172) an account with nobody
 * shows the example people instead, as the list below it does.
 */
export function StaffPeopleRow({ role }: { readonly role: 'admin' | 'provider' }) {
  const { state: session } = useSession();
  const accountId = session.status === 'signed-in' ? session.session.userId : '';
  const { ranked } = useRankedPeople(accountId);
  return <PeopleRowView role={role} ranked={ranked} />;
}

/** The row, from a ranking already in hand (the stories draw it this way too). */
export function PeopleRowView({
  role,
  ranked,
}: {
  readonly role: 'admin' | 'provider';
  readonly ranked: readonly RankedPerson<RankedPersonRow>[] | null;
}) {
  const { t } = useI18n();
  const examples = useExamplePeople();
  const example = useMemo(() => exampleRankedPeople(role), [role]);
  const label = t(role === 'admin' ? 'admin.members.title' : 'interested.title');

  if (ranked === null) return null;
  if (ranked.length > 0) return <PeopleStrip label={label} people={toStripPeople(ranked, t)} />;
  if (examples) return <PeopleStrip label={label} people={toStripPeople(example, t)} />;
  return (
    <PeopleStripEmpty
      label={label}
      inviteLabel={t('profile.menu.invite')}
      // A case manager invites a member straight away; a program lead picks (a member, or a colleague's program).
      inviteHref={role === 'admin' ? '/invite/new/?role=member' : '/invite/'}
    />
  );
}

/** The tiles for a ranked list; where a tap goes is decided by the ring's reason. */
export function toStripPeople(
  ranked: readonly RankedPerson<RankedPersonRow>[],
  t: (key: string) => string,
): PeopleStripPerson[] {
  return ranked.map(({ person, reason }) => ({
    id: person.id,
    firstName: person.firstName,
    href:
      reason === 'message' && person.conversationId
        ? `/messages/thread/?id=${encodeURIComponent(person.conversationId)}`
        : `/person/?id=${encodeURIComponent(person.id)}`,
    hasActivity: reason !== null,
    ...(reason ? { activityLabel: t(`people.new.${reason}`) } : {}),
  }));
}
