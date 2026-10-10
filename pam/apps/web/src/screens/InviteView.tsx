'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { MeIcon, Notice, PlacesIcon, ShieldIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { createInvite, type CreatedInvite } from '@/lib/useCaseload';
import { HelpButton } from './HelpButton';
import { InviteReady } from './InviteReady';
import { InviteForWho, type InviteWho } from './InviteForWho';

/**
 * Invite someone (D-218, Will, 2 October): two kinds of invite and nothing
 * else — a member, or a program. The lists of members and program leads that
 * `/admin/` showed under the buttons are gone; Home is the list.
 *
 * Tapping a row asks who it is for — first name and mobile number, both
 * required (D-373) — then makes the invite (`create_invite`) and shows it as
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
  const [asking, setAsking] = useState<'member' | 'provider' | 'admin' | null>(null);

  const make = async (role: 'member' | 'provider' | 'admin', who: InviteWho) => {
    if (!canInvite) return;
    setBusy(true);
    setFailed(false);
    const created = await createInvite(role, who);
    setBusy(false);
    if (created) {
      setAsking(null);
      setInvite(created);
    } else {
      setFailed(true);
    }
  };

  return (
    // Choosing a kind of invite is a step in: the form is a page of its own, on the
    // nested template, with the kind of invite as its title and the round back
    // returning to the choice (Will, 10 October).
    <SubPage
      title={asking && !invite ? t(`invite.link.title.${asking}`) : t('profile.menu.invite')}
      {...(asking && !invite
        ? { onBack: () => setAsking(null), backLabel: t('invite.who.back') }
        : { backHref: '/', backLabel: t('nav.back.home') })}
      actions={<HelpButton />}
    >
      {invite ? (
        <InviteReady invite={invite} onAnother={() => setInvite(null)} />
      ) : asking ? (
        <InviteForWho role={asking} busy={busy} onSubmit={(who) => void make(asking, who)} />
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
              // A case manager or the super admin may invite a colleague too
              // (D-315, 0073); a program may not.
              ...(trueRole === 'admin' || trueRole === 'super_admin'
                ? [
                    {
                      id: 'case-manager',
                      label: t('invite.caseManager'),
                      description: t('invite.caseManager.body'),
                      onSelect: () => setAsking('admin'),
                      icon: <ShieldIcon {...ICON} />,
                    },
                  ]
                : []),
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
