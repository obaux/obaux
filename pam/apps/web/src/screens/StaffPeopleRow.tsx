'use client';

import { useMemo } from 'react';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { PeopleStrip } from '@pam/ui/PeopleStrip';
import { exampleRankedPeople } from '@/lib/exampleRankedPeople';
import { useI18n } from '@/lib/i18n';
import { useRankedPeople } from '@/lib/useRankedPeople';
import { useSession } from '@/lib/useSession';
import { toStripPeople } from '../app/HomePeopleSection';

/**
 * The people with something new, as a row of rings at the top of a case
 * manager's or program lead's Home (D-198, D-477, card a22): a ring on anyone who has
 * sent an unread message or saved a place since you last looked, those people
 * first, newest first. The same ranking and the same data as the old Home's
 * strip (`useRankedPeople`: `messageable_people`, conversations,
 * `people_activity`), drawn by the same `PeopleStrip`, and a tap goes where it
 * went: an unread message opens the conversation, anything else opens the
 * person. No heading and no "see all": the Home's own title says whose they are
 * and the list is on the screen already. Built for the redesigned Homes and
 * routed nowhere yet; it waits for Will's yes on the rings.
 *
 * A real account with nobody on its list draws the example people while the
 * demo is on (the same rule the caseload list below it follows), and nothing
 * otherwise: Home does not invent people.
 */
export function StaffPeopleRow({ role }: { readonly role: 'admin' | 'provider' }) {
  const { t } = useI18n();
  const { state: session } = useSession();
  const accountId = session.status === 'signed-in' ? session.session.userId : '';
  const { ranked } = useRankedPeople(accountId);
  const example = useMemo(() => exampleRankedPeople(role), [role]);

  const real = ranked ?? null;
  const list = real && real.length > 0 ? real : real && USE_DUMMY_PEOPLE ? example : null;
  if (!list || list.length === 0) return null;

  return (
    <PeopleStrip
      label={t(role === 'admin' ? 'admin.members.title' : 'interested.title')}
      people={toStripPeople(list, t)}
    />
  );
}
