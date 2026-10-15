'use client';

import { useMemo, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core/Heading';
import { VStack } from '@astryxdesign/core/VStack';
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
 * conversation, anything else opens the person. No "see all". A case manager's row has no heading (the
 * Home's own title says whose they are); a program lead's is headed "People interested in your program".
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

const styles = stylex.create({
  heading: { fontSize: '20px', lineHeight: 1.3, fontWeight: 700 },
});

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
  // A program lead's people are named on the screen (W4): the heading says who they are. A case manager's
  // are their own members, which the Home's title already says.
  const withHeading = (strip: ReactNode) =>
    role === 'provider' ? (
      <VStack gap={2}>
        <Heading level={2} xstyle={styles.heading}>
          {label}
        </Heading>
        {strip}
      </VStack>
    ) : (
      strip
    );
  if (ranked.length > 0) return withHeading(<PeopleStrip label={label} people={toStripPeople(ranked, t)} />);
  if (examples) return withHeading(<PeopleStrip label={label} people={toStripPeople(example, t)} />);
  return withHeading(
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
