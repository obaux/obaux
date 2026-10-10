'use client';

import { useEffect, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Loading, Notice } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/navigate';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { createInvite, listRegions, type CreatedInvite } from '@/lib/useCaseload';
import { NotIn } from '../app/NotIn';
import { HelpButton } from './HelpButton';
import { InviteForWho, type InviteWho } from './InviteForWho';
import { InviteReady } from './InviteReady';

/**
 * One invite, on a page of its own (D-442, Will, 10 October: "use the nested
 * page method"). Invite someone (`/invite/`) is a list of the kinds of invite;
 * each row comes here, the way "Add a person" goes to its own page
 * (`/program/book/new/`). The page's title says which kind, so the form
 * carries no heading of its own, and the way back is the page's Back.
 *
 * Their first name and mobile number (D-373), then the link (D-254). A
 * super admin has no city of their own and `create_invite` refuses to guess
 * one (0077), so they pick it here — nothing to pick with one city, a list
 * with several. The Everyone list used to carry its own copy of all this in a
 * card of buttons; it is gone.
 */
const styles = stylex.create({
  card: { width: '100%' },
  note: { fontSize: '16px', lineHeight: 1.5 },
});

type InviteRole = 'member' | 'provider' | 'admin';

export function InviteNewView({ role }: { readonly role: string | null }) {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const isSuperAdmin = trueRole === 'super_admin';
  const canInvite = trueRole === 'admin' || trueRole === 'provider' || isSuperAdmin;

  // A kind this person may not make (a program inviting a case manager, a made-up
  // value) goes back to the list of kinds rather than showing a form that fails.
  const allowed: InviteRole | null =
    role === 'member' || role === 'provider' || (role === 'admin' && (trueRole === 'admin' || isSuperAdmin))
      ? role
      : null;

  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [regionId, setRegionId] = useState('');
  const [needsCity, setNeedsCity] = useState(false);
  const [invite, setInvite] = useState<CreatedInvite | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    void listRegions().then((list) => {
      if (cancelled) return;
      setRegions(list);
      if (list.length === 1) setRegionId(list[0]!.id);
    });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const mayMake = session.status === 'signed-in' && canInvite && allowed !== null;
  useEffect(() => {
    if (role !== null && session.status === 'signed-in' && !mayMake) navigate('/invite/');
  }, [role, session.status, mayMake]);

  const frame = (children: ReactNode) => (
    <SubPage
      title={allowed ? t(`invite.link.title.${allowed}`) : t('profile.menu.invite')}
      backHref="/invite/"
      backLabel={t('nav.back.invite')}
      actions={<HelpButton />}
    >
      {children}
    </SubPage>
  );

  if (session.status === 'loading' || role === null) {
    return frame(<Loading label={t('common.loading')} variant="screen" />);
  }
  if (session.status === 'error') {
    return frame(
      <Notice
        notice="something_went_wrong"
        title={t('admin.invite.failed.title')}
        body={t('admin.invite.failed.body')}
        supportPhone={supportPhone}
        callLabel={t('help.callSupport')}
      />,
    );
  }
  if (session.status !== 'signed-in') {
    return frame(
      <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('directory.signedOut.body')} />,
    );
  }
  if (!mayMake) return frame(<Loading label={t('common.loading')} variant="screen" />);

  const make = async (who: InviteWho) => {
    if (isSuperAdmin && !regionId) {
      setNeedsCity(true);
      return;
    }
    setNeedsCity(false);
    setBusy(true);
    setFailed(false);
    const created = await createInvite(allowed!, who, isSuperAdmin ? regionId : undefined);
    setBusy(false);
    if (created) setInvite(created);
    else setFailed(true);
  };

  return frame(
    <>
      {invite ? (
        <InviteReady invite={invite} onAnother={() => navigate('/invite/')} hasHeading={false} />
      ) : (
        <>
          {isSuperAdmin && regions.length > 1 ? (
            <Card padding={6} xstyle={styles.card}>
              <VStack gap={3}>
                <RadioList label={t('directory.invite.city')} value={regionId} onChange={(next) => setRegionId(String(next))}>
                  {regions.map((region) => (
                    <RadioListItem key={region.id} value={region.id} label={region.name} />
                  ))}
                </RadioList>
                {needsCity ? (
                  <Text role="alert" type="supporting" xstyle={styles.note}>
                    {t('directory.invite.pickCity')}
                  </Text>
                ) : null}
              </VStack>
            </Card>
          ) : null}
          <InviteForWho role={allowed!} busy={busy} onSubmit={(who) => void make(who)} />
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
    </>,
  );
}
