'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { MeIcon, PlacesIcon, ShieldIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { HelpButton } from './HelpButton';

/**
 * Invite someone (D-218, Will, 2 October): two kinds of invite and nothing
 * else — a member, or a program. The lists of members and program leads that
 * `/admin/` showed under the buttons are gone; Home is the list.
 *
 * Tapping a row goes to a page of its own for that kind (`/invite/new/`,
 * D-442): who it is for — first name and mobile number, both required
 * (D-373) — then the invite (`create_invite`) shown as a link to send
 * (`InviteReady`, D-254). A case manager, a program lead (0070, D-219 —
 * Will, 2 October) and the super admin can all make codes; a member a
 * program invites lands on no caseload until a case manager picks them up.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
});

export function InviteView() {
  const { t } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;

  return (
    <SubPage title={t('profile.menu.invite')} backHref="/" backLabel={t('nav.back.home')} actions={<HelpButton />}>
      <Text type="supporting" xstyle={styles.intro}>
        {t('invite.intro')}
      </Text>
      <MenuList
        label={t('profile.menu.invite')}
        items={[
          {
            id: 'member',
            label: t('invite.member'),
            description: t('invite.member.body'),
            href: '/invite/new/?role=member',
            icon: <MeIcon {...ICON} />,
          },
          {
            id: 'program',
            label: t('invite.program'),
            description: t('invite.program.body'),
            href: '/invite/new/?role=provider',
            icon: <PlacesIcon {...ICON} />,
          },
          // A case manager or the super admin may invite a colleague too
          // (D-315, 0073); a program may not.
          ...(trueRole === 'admin' || trueRole === 'super_admin'
            ? [
                {
                  id: 'case-manager',
                  label: t('invite.caseManager'),
                  description: t('invite.caseManager.body'),
                  href: '/invite/new/?role=admin',
                  icon: <ShieldIcon {...ICON} />,
                },
              ]
            : []),
        ]}
      />
    </SubPage>
  );
}
