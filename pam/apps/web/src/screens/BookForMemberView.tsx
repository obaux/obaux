'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { DUMMY_APPOINTMENTS } from '@pam/config/dummy-appointments';
import { dummyConversationsFor } from '@pam/config/dummy-conversations';
import { DUMMY_MEMBERS } from '@pam/config/dummy-people';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { PlusIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { readAddedTrips, TRIPS_CHANGED, withMoves } from '@/lib/addedTrips';
import { examplesOn } from '@/lib/examples';
import { useI18n } from '@/lib/i18n';
import { useConversations } from '@/lib/useConversations';
import { useProgramSetup } from '@/lib/programSetup';
import { useSession } from '@/lib/useSession';
import { whenHappened } from '@/lib/when';
import { HelpButton } from './HelpButton';
import { intlLocale } from '@pam/config';

/**
 * Book a visit for a member (D-316, D-322; Will, 6 October): the first thing
 * under a program lead's +. "They should be able to book on behalf of a user
 * who's messaged them" — so the list is the people in the program's
 * conversations, and each row says what a lead needs before tapping: are
 * they already booked (their next visit here) or not, when they last wrote,
 * and the last thing they said, on one line. A row opens New trip with this
 * program as the place and that person as who it is for.
 *
 * Above them, **Add a person**: somebody who has not used Pam yet, by name
 * and number (D-322). The program is the example program (D-218) until a
 * lead's own listing is loaded; the people are the example conversations.
 */
const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  heading: { fontSize: '20px', lineHeight: 1.3 },
  empty: { fontSize: '17px' },
  row: { minHeight: '72px' },
  name: { fontSize: '18px', lineHeight: 1.35 },
  meta: { fontSize: '15px', lineHeight: 1.4 },
  booked: { color: colorVars['--color-text-accent'], fontWeight: 600 },
  // The last message, one line, then "…" (Will, D-322: "max 1 line").
  snippet: {
    fontSize: '15px',
    lineHeight: 1.4,
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
    maxWidth: '100%',
  },
  words: { minWidth: 0 },
});

/** One person who has written to the program, from an example or a real conversation. */
interface Person {
  readonly id: string;
  readonly firstName: string;
  readonly lastMessageAt: string | null;
  readonly preview: { readonly body: string; readonly mine: boolean } | null;
}

const EXAMPLE_PROGRAM_ID = 'dummy-place-learning';
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

/** The soonest visit still ahead at this program, per person, example and booked alike. */
function useNextVisitHere(programId: string): Readonly<Record<string, string>> {
  const [next, setNext] = useState<Readonly<Record<string, string>>>({});
  useEffect(() => {
    const read = () => {
      const now = Date.now();
      const out: Record<string, string> = {};
      const consider = (personId: string, startsAt: string) => {
        if (new Date(startsAt).getTime() <= now) return;
        if (!out[personId] || startsAt < out[personId]!) out[personId] = startsAt;
      };
      if (examplesOn()) for (const a of DUMMY_APPOINTMENTS) consider(a.personId, a.startsAt);
      for (const trip of withMoves(readAddedTrips())) {
        if (trip.forMemberId && trip.placeId === programId) consider(trip.forMemberId, trip.startsAt);
      }
      setNext(out);
    };
    read();
    window.addEventListener(TRIPS_CHANGED, read);
    return () => window.removeEventListener(TRIPS_CHANGED, read);
  }, [programId]);
  return next;
}

export function BookForMemberView() {
  const { t, locale } = useI18n();
  // The lead's own program (D-509); the example one only in a demo or Storybook, with its example people.
  const { state: session } = useSession();
  const setup = useProgramSetup(session);
  const [examples, setExamples] = useState(false);
  useEffect(() => setExamples(examplesOn()), []);
  const own = setup.program;
  const programId = own ? own.id : EXAMPLE_PROGRAM_ID;
  const place = own
    ? { name: own.details.name, category: own.details.category, address: own.details.address }
    : examples
      ? DUMMY_PLACES_BY_ID[EXAMPLE_PROGRAM_ID]
      : undefined;
  const nextHere = useNextVisitHere(programId);
  // Who wrote to the program (S1, Iris's program lead pass): a real lead's own conversations with members,
  // first name and last message only (D-541 part 2, D-542); the example people only in a demo or Storybook.
  const { state: conversations } = useConversations(!examples && session.status === 'signed-in');
  const people: readonly Person[] = examples
    ? dummyConversationsFor('provider').flatMap((c) => {
        const member = DUMMY_MEMBERS.find((m) => m.id === c.otherId);
        return member
          ? [{ id: member.id, firstName: member.firstName, lastMessageAt: c.lastMessageAt ?? null, preview: c.preview ?? null }]
          : [];
      })
    : conversations.status === 'ready'
      ? conversations.conversations.flatMap((c) =>
          c.otherRole === 'member' && c.otherProfileId
            ? [
                {
                  id: c.otherProfileId,
                  firstName: c.otherName ?? '',
                  lastMessageAt: c.lastMessageAt,
                  preview: c.lastMessageBody ? { body: c.lastMessageBody, mine: c.lastMessageMine } : null,
                },
              ]
            : [],
        )
      : [];

  const when = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const clock = new Intl.DateTimeFormat(intlLocale(locale), { hour: 'numeric', minute: '2-digit' });
  /** "Today 2:37 PM", "Yesterday", "Oct 3" — Messages' own words, with the time when it is today. */
  const wrote = (iso: string) => {
    const said = whenHappened(iso, locale, t);
    return said === t('when.today') ? `${said} ${clock.format(new Date(iso))}` : said;
  };
  const hrefFor = (id: string, name: string) =>
    `/trips/new/?${new URLSearchParams({
      place: programId,
      ...(place ? { name: place.name, category: place.category, address: place.address } : {}),
      for: id,
      forName: name,
    }).toString()}`;

  return (
    <SubPage title={t('book.title')} backHref="/" backLabel={t('nav.back.home')} actions={<HelpButton />}>
      <Text type="supporting" xstyle={styles.intro}>
        {t('book.intro')}
      </Text>

      {/* Somebody new to Pam, first: the desk case (D-322). */}
      <MenuList
        label={t('book.add')}
        items={[
          {
            id: 'add',
            label: t('book.add'),
            description: t('book.add.body'),
            icon: <PlusIcon {...ICON} />,
            href: '/program/book/new/',
          },
        ]}
      />

      <Heading level={2} xstyle={styles.heading}>
        {t('book.people')}
      </Heading>
      {people.length === 0 && !examples && conversations.status === 'loading' ? null : people.length === 0 ? (
        <Text type="supporting" xstyle={styles.empty}>
          {t('book.empty')}
        </Text>
      ) : (
        <List aria-label={t('book.people')}>
          {people.map((person) => {
            const next = nextHere[person.id];
            return (
              <ListItem
                key={person.id}
                href={hrefFor(person.id, person.firstName)}
                label={<Text xstyle={styles.name}>{person.firstName}</Text>}
                description={
                  <VStack gap={0} xstyle={styles.words}>
                    <HStack gap={1} align="center" wrap="wrap">
                      <Text type={next ? 'body' : 'supporting'} xstyle={[styles.meta, Boolean(next) && styles.booked]}>
                        {next ? t('book.booked', { when: when.format(new Date(next)) }) : t('book.notBooked')}
                      </Text>
                      {person.lastMessageAt ? (
                        <Text type="supporting" xstyle={styles.meta}>
                          · {t('book.wrote', { when: wrote(person.lastMessageAt) })}
                        </Text>
                      ) : null}
                    </HStack>
                    {person.preview ? (
                      <Text type="supporting" xstyle={styles.snippet}>
                        {person.preview.mine ? t('messages.preview.you', { text: person.preview.body }) : person.preview.body}
                      </Text>
                    ) : null}
                  </VStack>
                }
                startContent={<Avatar size="md" name={person.firstName} tooltip={false} alt="" />}
                endContent={<Icon icon="chevronRight" size="md" />}
                xstyle={styles.row}
              />
            );
          })}
        </List>
      )}
    </SubPage>
  );
}
