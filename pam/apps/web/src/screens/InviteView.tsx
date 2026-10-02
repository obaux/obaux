'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { MeIcon, Notice, PhoneIcon, PlacesIcon, TextLink } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { createInvite, type CreatedInvite } from '@/lib/useCaseload';
import { HelpButton } from './HelpButton';

/**
 * Invite someone (D-218, Will, 2 October): two kinds of invite and nothing
 * else — a member, or a program. The lists of members and program leads that
 * `/admin/` showed under the buttons are gone; Home is the list.
 *
 * Tapping a row makes the code at once (`create_invite`, 0049) and shows it
 * with the date it stops working and a way to copy it. A case manager or the
 * super admin can make codes; a program lead cannot yet — the database
 * refuses them (0049), and whether programs should bring people in is Will's
 * call — so for them the same two rows explain that PAM sends invites for
 * now, with PAM one tap away.
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
  const { viewedRole } = useRoleView(trueRole);
  const canInvite = trueRole === 'admin' || trueRole === 'super_admin';

  const [invite, setInvite] = useState<CreatedInvite | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [notYet, setNotYet] = useState(false);
  const [copied, setCopied] = useState(false);

  const make = async (role: 'member' | 'provider') => {
    if (!canInvite || viewedRole === 'provider') {
      setNotYet(true);
      return;
    }
    setBusy(true);
    setFailed(false);
    const created = await createInvite(role);
    setBusy(false);
    if (created) {
      setInvite(created);
      setCopied(false);
    } else {
      setFailed(true);
    }
  };

  return (
    <SubPage title={t('profile.menu.invite')} backHref="/" backLabel={t('nav.back.home')} actions={<HelpButton />}>
      {invite ? (
        <Card padding={6}>
          <VStack gap={3}>
            <Heading level={2} xstyle={styles.heading}>
              {t(invite.role === 'provider' ? 'invite.ready.program' : 'invite.ready.member')}
            </Heading>
            <Text xstyle={styles.code}>{invite.code}</Text>
            <Text type="supporting" xstyle={styles.note}>
              {t('admin.invite.ready')}{' '}
              {t('admin.invite.expires', {
                date: new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(
                  new Date(invite.expiresAt),
                ),
              })}
            </Text>
            <HStack gap={3} align="center" wrap="wrap">
              <Button
                label={copied ? t('admin.invite.copied') : t('admin.invite.copy')}
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard?.writeText(invite.code).then(() => setCopied(true));
                }}
                xstyle={styles.button}
              />
              <TextLink label={t('admin.invite.another')} onClick={() => setInvite(null)} />
            </HStack>
          </VStack>
        </Card>
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
                label: busy ? t('admin.invite.creating') : t('invite.member'),
                description: t('invite.member.body'),
                onSelect: () => void make('member'),
                icon: <MeIcon {...ICON} />,
              },
              {
                id: 'program',
                label: t('invite.program'),
                description: t('invite.program.body'),
                onSelect: () => void make('provider'),
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

      {notYet ? (
        <VStack gap={2}>
          <Heading level={2} xstyle={styles.heading}>
            {t('invite.notYet.title')}
          </Heading>
          <Text xstyle={styles.note}>{t('invite.notYet.body')}</Text>
          <MenuList
            label={t('invite.notYet.title')}
            items={[
              {
                id: 'call',
                label: t('help.menu.call'),
                description: t('help.call.body'),
                href: `tel:${supportPhone}`,
                icon: <PhoneIcon {...ICON} />,
              },
            ]}
          />
        </VStack>
      ) : null}
    </SubPage>
  );
}
