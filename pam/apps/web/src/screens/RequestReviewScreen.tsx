'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { intlLocale } from '@pam/config';
import { BigButton, Loading, MessagesIcon, Notice, PlacesIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { goBack, navigate } from '@/lib/navigate';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { reviewStaffRequest, useStaffRequests } from '@/lib/useStaffRequests';
import { listRegions } from '@/lib/useCaseload';
import { useRoleView } from '@/lib/useViewedRole';
import { HelpButton } from './HelpButton';
import { useTextRequester } from './TextRequesterButton';

/**
 * One request to bring somebody in as staff, on a page of its own (D-444,
 * Will, 10 October: super admin screens on the latest templates). The list
 * (`RequestsScreen`) is rows; a row comes here, the way a visit or a place does:
 * who asked and for what, a look at the program they described, a way to text
 * them first (D-262), the city to bring them in under — and the decision pinned
 * to the foot of the screen, **Approve** the one primary action and **Deny**
 * beside it, as on every profile (D-440).
 *
 * The city used to be one picker at the top of the whole list, "because a
 * super admin reviewing several is very often reviewing them for the same
 * city". It is asked here instead, only when there is more than one city, and
 * a request that names no city for Pam to choose from is approved with the one.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  facts: { fontSize: '17px', lineHeight: 1.45 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  card: { width: '100%' },
  actions: { width: '100%' },
});

function askedOn(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', day: 'numeric' }).format(new Date(iso));
}

export function RequestReviewScreen({ userId }: { readonly userId: string | null }) {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin';
  const { state } = useStaffRequests(isSuperAdmin);

  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [regionId, setRegionId] = useState('');
  const [needsCity, setNeedsCity] = useState(false);
  const [busy, setBusy] = useState<'approved' | 'denied' | null>(null);
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

  const row = state.status === 'ready' ? state.requests.find((r) => r.userId === userId) : undefined;
  const text = useTextRequester(userId ?? '');
  const back = { onBack: () => goBack('/requests/'), backLabel: t('nav.back.requests') };

  if (state.status === 'loading' || session.status === 'loading' || userId === null) {
    return (
      <SubPage title={t('requests.title')} {...back} actions={<HelpButton />}>
        <Loading label={t('common.loading')} variant="screen" />
      </SubPage>
    );
  }

  if (!row) {
    return (
      <SubPage title={t('requests.title')} {...back} actions={<HelpButton />}>
        <Text xstyle={styles.facts}>{t('requests.program.gone')}</Text>
      </SubPage>
    );
  }

  const name = [row.firstName, row.lastName].filter(Boolean).join(' ') || t('invite.expired.someone');

  const decide = async (decision: 'approved' | 'denied') => {
    if (decision === 'approved' && !regionId) {
      setNeedsCity(true);
      return;
    }
    setNeedsCity(false);
    setFailed(false);
    setBusy(decision);
    const ok = await reviewStaffRequest(row.userId, decision, regionId || undefined);
    setBusy(null);
    if (ok) navigate('/requests/');
    else setFailed(true);
  };

  return (
    <SubPage
      title={name}
      subtitle={t('requests.wants', { role: t(`role.${row.wantsRole}`) })}
      {...back}
      actions={<HelpButton />}
      footer={
        <VStack gap={2} xstyle={styles.actions}>
          <BigButton
            label={busy === 'approved' ? t('requests.saving') : t('requests.approve')}
            isDisabled={busy !== null}
            onPress={() => void decide('approved')}
          />
          <BigButton
            label={busy === 'denied' ? t('requests.saving') : t('requests.deny')}
            variant="secondary"
            isDisabled={busy !== null}
            onPress={() => void decide('denied')}
          />
        </VStack>
      }
    >
      <Text type="supporting" xstyle={styles.facts}>
        {row.city ? `${t('requests.city', { city: row.city })} · ` : ''}
        {t('requests.requestedOn', { when: askedOn(row.createdAt, locale) })}
      </Text>

      {regions.length > 1 ? (
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

      {/*
        Look before deciding (Will, 4 October, D-262): the program a would-be
        program lead described at sign-up, and a text to them first, "to make
        sure they coordinate how to use the app".
      */}
      <MenuList
        label={name}
        items={[
          ...(row.program
            ? [
                {
                  id: 'program',
                  label: row.program.name,
                  description: t('requests.viewProgram.hint'),
                  href: `/requests/program/?id=${encodeURIComponent(row.userId)}`,
                  icon: <PlacesIcon {...ICON} />,
                },
              ]
            : []),
          {
            id: 'text',
            label: t('requests.text', { name: row.firstName ?? t('invite.expired.someone') }),
            ...(text.missing ? { description: t('requests.text.none') } : {}),
            onSelect: () => void text.open(),
            icon: <MessagesIcon {...ICON} />,
          },
        ]}
      />

      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('requests.failed.title')}
          body={t('requests.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}
    </SubPage>
  );
}
