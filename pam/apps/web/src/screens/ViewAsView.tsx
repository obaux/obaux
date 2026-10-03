'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { ROLES, type Role } from '@pam/config';
import { MeIcon, PeopleIcon, ShieldIcon, PlacesIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { MenuList } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';

/**
 * See the app as (D-217) — a super admin's preview of each role (D-108),
 * moved from the old app header's switch into a Profile row and a page of
 * its own, the same shape as Language: a list, a tick on the current one,
 * nothing to save. Only a super admin reaches it; anybody else is shown the
 * page with nothing to pick, because a switch they cannot use is not theirs.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const ICONS: Readonly<Record<Role, React.ReactNode>> = {
  member: <MeIcon {...ICON} />,
  admin: <PeopleIcon {...ICON} />,
  provider: <PlacesIcon {...ICON} />,
  super_admin: <ShieldIcon {...ICON} />,
};

const styles = stylex.create({ intro: { fontSize: '18px', lineHeight: 1.5 } });

export function ViewAsView() {
  const { t } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole, setViewAs } = useRoleView(trueRole);

  return (
    <SubPage title={t('viewAs.title')} backHref="/profile/" backLabel={t('nav.back.profile')}>
      <Text type="supporting" xstyle={styles.intro}>
        {t('viewAs.intro')}
      </Text>
      {trueRole === 'super_admin' ? (
        <MenuList
          label={t('viewAs.title')}
          items={ROLES.map((role) => ({
            id: role,
            label: t(`role.${role}`),
            icon: ICONS[role],
            isSelected: viewedRole === role,
            onSelect: () => setViewAs(role),
          }))}
        />
      ) : null}
    </SubPage>
  );
}
