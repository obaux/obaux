'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { MeIcon, Notice, PlacesIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { createInvite, type CreatedInvite } from '@/lib/useCaseload';
import { HelpButton } from './HelpButton';
import { InviteReady } from './InviteReady';
import { InvitePhoneStep } from './InvitePhoneStep';

/**
 * Invite someone (D-218, Will, 2 October): two kinds of invite and nothing
 * else — a member, or a program. The lists of members and program leads that
 * `/admin/` showed under the buttons are gone; Home is the list.
 *
 * Tapping a row makes the invite at once (`create_invite`) and shows it as
 * a link to send (`InviteReady`, D-254). A case manager, a program
 * lead (0070, D-219 — Will, 2 October) and the super admin can all make
 * codes; a member a program invites lands on no caseload until a case
 * manager picks them up.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  heading: { fontSize: '20px', lineHeight: 1.3 },
  code: { fontSize: '34px', fontWeight: 700, letterSpacing: '0.08em' },
  note: { fontSize: '16px', lineHeight: 1.5 },
  button: { minHeight: '48px', fontSize: '17px' },
});

export function InviteView() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const canInvite = trueRole === 'admin' || trueRole === 'provider' || trueRole === 'super_admin';

  const [invite, setInvite] = useState<CreatedInvite | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  /** Who is being invited, while their number is asked for (D-258). */
  const [asking, setAsking] = useState<'member' | 'provider' | null>(null);

  const make = async (role: 'member' | 'provider', phone: string) => {
    if (!canInvite) return;
    setBusy(true);
    setFailed(false);
    const created = await createInvite(role, undefined, phone);
    setBusy(false);
    if (created) {
      setAsking(null);
      setInvite(created);
    } else {
      setFailed(true);
    }
  };

  return (
    <SubPage title={t('profile.menu.invite')} backHref="/" backLabel={t('nav.back.home')} actions={<HelpButton />}>
      {invite ? (
        <InviteReady invite={invite} onAnother={() => setInvite(null)} />
      ) : asking ? (
        <InvitePhoneStep
          role={asking}
          isBusy={busy}
          onMake={(phone) => void make(asking, phone)}
          onBack={() => setAsking(null)}
        />
      ) : (
        <>
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
                onSelect: () => setAsking('member'),
                icon: <MeIcon {...ICON} />,
              },
              {
                id: 'program',
                label: t('invite.program'),
                description: t('invite.program.body'),
                onSelect: () => setAsking('provider'),
                icon: <PlacesIcon {...ICON} />,
              },
            ]}
          />
        </>
      )}

      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('admin.invite.failed.title')}
          body={t('admin.invite.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

    </SubPage>
  );
}
