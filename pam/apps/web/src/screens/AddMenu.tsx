'use client';

import * as stylex from '@stylexjs/stylex';
import { useRouter } from 'next/navigation';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { HStack } from '@astryxdesign/core/HStack';
import { PeopleIcon, PlacesIcon, PlusIcon } from '@pam/ui';
import { useI18n } from '@/lib/i18n';

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
export function AddMenu() {
  const { t } = useI18n();
  const router = useRouter();
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
        {
          id: 'invite',
          label: t('profile.menu.invite'),
          icon: <PeopleIcon {...ICON} />,
          onClick: () => router.push('/invite/'),
        },
        {
          id: 'program',
          label: t('programs.add'),
          icon: <PlacesIcon {...ICON} />,
          onClick: () => router.push('/programs/new/'),
        },
      ]}
    />
  );
}
