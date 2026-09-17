'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { AppHeader, Loading, Notice, Page, PageTitle, TextLink } from '@pam/ui';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { HeaderBell } from '../HeaderBell';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useStaffRequests, reviewStaffRequest, type StaffRequestRow } from '@/lib/useStaffRequests';
import { listRegions } from '@/lib/useCaseload';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../RoleSwitchControl';

/**
 * Deciding who becomes a case manager or a program lead, for real (0054).
 *
 * `staff_requests` has recorded these claims since 0046 and nothing has ever
 * reviewed one — a super admin who wanted to bring somebody in had to make
 * them an invite by hand, asking them to sign up a second time. This screen
 * is the missing other half: read the claim, pick a city, approve or deny.
 *
 * Reached from the Everyone list rather than from the notification itself
 * (Will, 17 September) — a notification here stays what it already is
 * everywhere else in PAM, a line in a log rather than a button (D-080). The
 * notification says something is waiting; this screen is where it gets
 * decided.
 *
 * One region picker for the whole screen, not one per row: a super admin
 * reviewing several requests in a sitting is very often reviewing them for
 * the same city, the same way `directory/page.tsx`'s own invite card asks
 * once. Approving with a different city in mind is one tap away — reselect,
 * then approve the next one.
 */

const styles = stylex.create({
  card: { width: '100%' },
  name: { fontSize: '20px' },
  meta: { fontSize: '16px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  action: { minHeight: '48px' },
});

function requestedWhen(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso));
}

export default function RequestsPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole, setViewAs } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin';

  const { state: requests, refresh } = useStaffRequests(isSuperAdmin);

  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [regionId, setRegionId] = useState<string>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [needsCity, setNeedsCity] = useState(false);
  const [failedId, setFailedId] = useState<string | null>(null);

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

  const decide = async (row: StaffRequestRow, decision: 'approved' | 'denied') => {
    if (decision === 'approved' && !regionId) {
      setNeedsCity(true);
      return;
    }
    setNeedsCity(false);
    setFailedId(null);
    setBusyId(row.userId);
    const ok = await reviewStaffRequest(row.userId, decision, regionId || undefined);
    setBusyId(null);
    if (ok) {
      refresh();
    } else {
      setFailedId(row.userId);
    }
  };

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <AppHeader />
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('directory.signedOut.body')} />
      </Page>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Page gap={4}>
        <AppHeader
          roleLabel={viewedRole ? t(`role.${viewedRole}`) : undefined}
          roleControl={
            trueRole === 'super_admin' ? (
              <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
            ) : undefined
          }
          trailing={<HeaderBell enabled={trueRole !== null} role={viewedRole} />}
        />
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <TextLink label={t('admin.back')} href="/directory/" />
      </Page>
    );
  }

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={t('role.super_admin')}
        roleControl={<RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />}
        trailing={<HeaderBell enabled={isSuperAdmin} role={viewedRole} />}
      />

      <PageTitle
        title={t('requests.title')}
        subtitle={
          requests.status === 'ready' ? t('requests.count', { count: requests.requests.length }) : undefined
        }
        backHref="/directory/"
        backLabel={t('nav.back.directory')}
      />

      {regions.length > 1 ? (
        <Card xstyle={styles.card}>
          <RadioList label={t('directory.invite.city')} value={regionId} onChange={(next) => setRegionId(String(next))}>
            {regions.map((region) => (
              <RadioListItem key={region.id} value={region.id} label={region.name} />
            ))}
          </RadioList>
        </Card>
      ) : null}

      {requests.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

      {requests.status === 'error' ? (
        <Notice
          notice={requests.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[requests.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[requests.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {requests.status === 'ready' && requests.requests.length === 0 ? (
        <Notice
          notice="no_caseload_members"
          title={t('requests.empty.title')}
          body={t('requests.empty.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {requests.status === 'ready' ? (
        <VStack gap={3}>
          {requests.requests.map((row) => (
            <Card key={row.userId} xstyle={styles.card}>
              <VStack gap={2}>
                <Heading level={3} xstyle={styles.name}>
                  {row.firstName ?? '—'} {row.lastName ?? ''}
                </Heading>
                <Text type="supporting" xstyle={styles.meta}>
                  {t('requests.wants', { role: t(`role.${row.wantsRole}`) })}
                  {row.city ? ` · ${t('requests.city', { city: row.city })}` : ''}
                  {' · '}
                  {t('requests.requestedOn', { when: requestedWhen(row.createdAt, locale) })}
                </Text>
                {needsCity && busyId === null ? (
                  <Text type="supporting" xstyle={styles.note}>
                    {t('directory.invite.pickCity')}
                  </Text>
                ) : null}
                {failedId === row.userId ? (
                  <Notice
                    notice="something_went_wrong"
                    title={t('requests.failed.title')}
                    body={t('requests.failed.body')}
                    supportPhone={supportPhone}
                    callLabel={t('help.callSupport')}
                  />
                ) : null}
                <HStack gap={2} wrap="wrap">
                  <Button
                    label={busyId === row.userId ? t('requests.saving') : t('requests.approve')}
                    variant="primary"
                    onClick={() => void decide(row, 'approved')}
                    isDisabled={busyId !== null}
                    xstyle={styles.action}
                  />
                  <Button
                    label={t('requests.deny')}
                    variant="secondary"
                    onClick={() => void decide(row, 'denied')}
                    isDisabled={busyId !== null}
                    xstyle={styles.action}
                  />
                </HStack>
              </VStack>
            </Card>
          ))}
        </VStack>
      ) : null}
    </Page>
  );
}
