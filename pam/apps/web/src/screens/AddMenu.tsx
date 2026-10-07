'use client';

import * as stylex from '@stylexjs/stylex';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { HStack } from '@astryxdesign/core/HStack';
import { ExploreIcon, PeopleIcon, PlacesIcon, PlusIcon, TripsIcon } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/navigate';

const styles = stylex.create({
  // The brand's filled green, round — the one "make something" control in the
  // bar, like New message on Messages (D-220).
  trigger: {
    width: '48px',
    height: '48px',
    minWidth: '48px',
    borderRadius: '50%',
    paddingInline: '0px',
    flexShrink: 0,
  },
});

const ICON = { width: 22, height: 22, 'aria-hidden': true } as const;

/**
 * The + at the end of a program lead's Home bar (D-221, Will, 2 October):
 * where Invite someone lives now, beside Add a program — the two things a
 * staff member starts from Home. A menu, so the bar stays three round buttons.
 */
export function AddMenu({ onSearch = null }: { readonly onSearch?: (() => void) | null } = {}) {
  const { t } = useI18n();
  return (
    <DropdownMenu
      button={{
        label: t('home.add'),
        isIconOnly: true,
        variant: 'primary',
        icon: (
          <HStack>
            <PlusIcon width={24} height={24} aria-hidden />
          </HStack>
        ),
        xstyle: styles.trigger,
      }}
      hasChevron={false}
      placement="below"
      alignment="end"
      menuWidth={240}
      items={[
        // First (Will, 6 October, D-316): a visit booked for somebody who
        // wrote to the program — it lands on their Trips as if they had.
        {
          id: 'book',
          label: t('home.book'),
          icon: <TripsIcon {...ICON} />,
          onClick: () => navigate('/program/book/'),
        },
        {
          id: 'invite',
          label: t('profile.menu.invite'),
          icon: <PeopleIcon {...ICON} />,
          onClick: () => navigate('/invite/'),
        },
        {
          id: 'program',
          label: t('programs.add'),
          icon: <PlacesIcon {...ICON} />,
          onClick: () => navigate('/programs/new/'),
        },
        // Search, from the + now (Will, 7 October, D-358): the bar turns into
        // the search field, ready to type. Only once there is enough to search.
        ...(onSearch
          ? [{ id: 'search', label: t('home.search'), icon: <ExploreIcon {...ICON} />, onClick: onSearch }]
          : []),
      ]}
    />
  );
}
