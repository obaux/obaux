'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { Avatar } from '@astryxdesign/core/Avatar';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { DUMMY_MEMBERS } from '@pam/config/dummy-people';
import { dummyConversationsFor } from '@pam/config/dummy-conversations';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { HelpButton } from './HelpButton';

/**
 * Book a visit for a member (D-316, Will, 6 October): the first thing under
 * a program lead's +. "They should be able to book on behalf of a user
 * who's messaged them" — so the list is the people in the program's
 * conversations, each a row into New trip with this program as the place
 * and that person as who it is for. The trip then shows on their Trips and
 * on the program's schedule alike.
 *
 * The program is the example program (D-218) until a lead's own listing is
 * loaded; the people are the example conversations (D-220).
 */
const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  empty: { fontSize: '17px' },
});

const PROGRAM_PLACE_ID = 'dummy-place-learning';

export function BookForMemberView() {
  const { t } = useI18n();
  const place = DUMMY_PLACES_BY_ID[PROGRAM_PLACE_ID];
  const people = dummyConversationsFor('provider')
    .map((c) => DUMMY_MEMBERS.find((m) => m.id === c.otherId))
    .filter((m): m is (typeof DUMMY_MEMBERS)[number] => Boolean(m));

  return (
    <SubPage title={t('book.title')} backHref="/" backLabel={t('nav.back.home')} actions={<HelpButton />}>
      <Text type="supporting" xstyle={styles.intro}>
        {t('book.intro')}
      </Text>
      {people.length === 0 ? (
        <Text type="supporting" xstyle={styles.empty}>
          {t('book.empty')}
        </Text>
      ) : (
        <MenuList
          label={t('book.title')}
          items={people.map((m) => ({
            id: m.id,
            label: m.firstName,
            description: t('book.row'),
            icon: <Avatar size="md" name={m.firstName} tooltip={false} alt="" />,
            href: `/trips/new/?${new URLSearchParams({
              place: PROGRAM_PLACE_ID,
              ...(place ? { name: place.name, category: place.category, address: place.address } : {}),
              for: m.id,
              forName: m.firstName,
            }).toString()}`,
          }))}
        />
      )}
    </SubPage>
  );
}
