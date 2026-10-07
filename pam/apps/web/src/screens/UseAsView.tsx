'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import type { Role } from '@pam/config';
import { MeIcon, Notice, PlacesIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/navigate';
import { switchRole } from '@/lib/useRoles';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';

/**
 * Use Pam as (D-374, D-375): for somebody who is a member and also works at
 * a program. A page of its own behind a Profile row — not a switch in the
 * header — so nobody changes side by accident (Will, 7 October). The same
 * shape as Language and See the app as: a list, a tick on the current one.
 *
 * What the switch changes is real, not a preview: the database answers as
 * the side they pick (`switch_role`), and the other side's data is out of
 * reach until they switch back.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({ intro: { fontSize: '18px', lineHeight: 1.5 } });

export function UseAsView({ preview }: { readonly preview?: { roles: readonly Role[]; role: Role } } = {}) {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const live = session.status === 'signed-in' ? session.session : null;
  const roles = preview?.roles ?? live?.roles ?? [];
  const [current, setCurrent] = useState<Role | null>(null);
  const acting = current ?? preview?.role ?? live?.role ?? null;
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const choose = async (role: Role) => {
    if (busy || role === acting) return;
    setBusy(true);
    setFailed(false);
    const ok = preview ? true : await switchRole(role);
    setBusy(false);
    if (!ok) {
      setFailed(true);
      return;
    }
    setCurrent(role);
    navigate('/');
  };

  const options = (['member', 'provider'] as const).filter((role) => roles.includes(role));

  return (
    <SubPage title={t('useAs.title')} backHref="/profile/" backLabel={t('nav.back.profile')}>
      <Text type="supporting" xstyle={styles.intro}>
        {t('useAs.intro')}
      </Text>
      <MenuList
        label={t('useAs.title')}
        items={options.map((role) => ({
          id: role,
          label: t(`useAs.${role}`),
          description: t(`useAs.${role}.body`),
          icon: role === 'member' ? <MeIcon {...ICON} /> : <PlacesIcon {...ICON} />,
          isSelected: acting === role,
          onSelect: () => void choose(role),
        }))}
      />
      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('useAs.failed')}
          body={t('admin.invite.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}
    </SubPage>
  );
}
