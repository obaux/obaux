'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { DUMMY_MEMBERS, DUMMY_EVERYONE, DUMMY_INTERESTED } from '@pam/config/dummy-people';
import { TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { PersonRow } from './PersonRow';

/**
 * A taste of the example people, on Home itself, while a super admin is
 * previewing a role (Will, 16 September: "let's pull in the dummy names for
 * viewing modes into the dashboard home page"). `/admin/`, `/directory/` and
 * `/interested/` already show the full example roster — this is a three-row
 * preview of the same set, so Home itself looks like an app with people in
 * it during a preview rather than only the menu underneath it, and "see all"
 * goes to the real screen for the rest.
 *
 * Loaded lazily (see `HomePeoplePreviewLazy`) for the same reason
 * `RoleSwitchLazy` is: this renders for exactly the one role — a super admin
 * actively previewing something other than their own account — that can ever
 * see it, so nobody else's first load should carry its weight.
 */

const styles = stylex.create({
  section: { fontSize: '17px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

const CONTENT: Record<
  'admin' | 'super_admin' | 'provider',
  {
    titleKey: string;
    seeAllHref: string;
    people: readonly { id: string; firstName: string; regionName: string }[];
  }
> = {
  admin: { titleKey: 'admin.members.title', seeAllHref: '/admin/', people: DUMMY_MEMBERS.slice(0, 3) },
  super_admin: {
    titleKey: 'directory.title',
    seeAllHref: '/directory/',
    people: DUMMY_EVERYONE.slice(0, 3),
  },
  provider: {
    titleKey: 'interested.title',
    seeAllHref: '/interested/',
    people: DUMMY_INTERESTED.slice(0, 3).map((interest) => interest.person),
  },
};

export function HomePeoplePreview({ role }: { readonly role: 'admin' | 'super_admin' | 'provider' }) {
  const { t } = useI18n();
  const { titleKey, seeAllHref, people } = CONTENT[role];

  return (
    <VStack gap={2}>
      <HStack gap={2} align="center" justify="between" wrap="nowrap">
        <Heading level={2} xstyle={styles.section}>
          {t(titleKey)}
        </Heading>
        <TextLink label={t('saved.seeAll')} href={seeAllHref} size="quiet" />
      </HStack>
      <VStack gap={3}>
        {people.map((person) => (
          <PersonRow
            key={person.id}
            firstName={person.firstName}
            href={`/person/?id=${person.id}`}
            meta={[person.regionName]}
          />
        ))}
      </VStack>
      <Text type="supporting" xstyle={styles.note}>
        {t('example.people.note')}
      </Text>
    </VStack>
  );
}
