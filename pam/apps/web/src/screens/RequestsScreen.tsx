'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@pam/ui/Button';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Loading, Notice, Page, PeopleIcon, PlacesIcon } from '@pam/ui';
import { FloatingAction } from '@pam/ui/FloatingAction';
import { MenuList } from '@pam/ui/MenuList';
import { SubPageHeader } from '@pam/ui/SubPage';
import { HelpButton } from './HelpButton';
import { HeaderActions } from './HeaderActions';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { NOTICES, intlLocale } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../app/NotIn';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useStaffRequests, reviewStaffRequest, type StaffRequestRow } from '@/lib/useStaffRequests';
import { listRegions } from '@/lib/useCaseload';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../app/RoleSwitchControl';
import { TextRequesterButton } from './TextRequesterButton';

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
 * everywhere else in Pam, a line in a log rather than a button (D-080). The
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
  return new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', day: 'numeric' }).format(new Date(iso));
}

/**
 * Staff requests, as a page (`/requests/`) or as a super admin's Home
 * (Will, 4 October, D-257: "Homepage for Admin should not be Explore, rather
 * requests to be approved or denied"). As Home it wears the tab-screen
 * header — large title, the bell — and has no back; as a page it is the
 * nested template it always was, back to Everyone.
 */
export function RequestsScreen({ isHome = false }: { readonly isHome?: boolean } = {}) {
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

  const tools = (
    <>
      {trueRole === 'super_admin' ? (
        <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
      ) : null}
      {isHome ? <HeaderActions role="super_admin" /> : <HelpButton />}
    </>
  );
  const header = (subtitle?: string) =>
    isHome ? (
      <LargeTitleHeader title={t('requests.title')} actions={tools} />
    ) : (
      <SubPageHeader
        title={t('requests.title')}
        {...(subtitle ? { subtitle } : {})}
        backHref="/directory/"
        backLabel={t('nav.back.directory')}
        actions={tools}
      />
    );

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        {header()}
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        {header()}
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('directory.signedOut.body')} />
      </Page>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Page gap={4}>
        {header()}
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      </Page>
    );
  }

  const page = (
    <Page gap={4}>
      {header(requests.status === 'ready' ? t('requests.count', { count: requests.requests.length }) : undefined)}

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
                {/*
                  Look before deciding (Will, 4 October, D-262): the program
                  a would-be program lead described at sign-up.
                */}
                {row.program ? (
                  <MenuList
                    label={t('requests.program.title')}
                    items={[
                      {
                        id: 'program',
                        label: row.program.name,
                        description: t('requests.viewProgram.hint'),
                        href: `/requests/program/?id=${encodeURIComponent(row.userId)}`,
                        icon: <PlacesIcon width={26} height={26} aria-hidden />,
                      },
                    ]}
                  />
                ) : null}
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
                  {/* Talk before they start, from the super admin's own phone (D-262). */}
                  <TextRequesterButton userId={row.userId} firstName={row.firstName} />
                </HStack>
              </VStack>
            </Card>
          ))}
        </VStack>
      ) : null}
    </Page>
  );
  if (!isHome) return page;
  return (
    <>
      {page}
      {/*
        Every invite and where it stands, one tap above the tab bar (Will,
        4 October, D-263) — the way a case manager's Home floats Invite
        someone (D-226). Outside the page: its motion wrapper would pin a
        fixed child to itself.
      */}
      <FloatingAction
        label={t('invites.log.title')}
        href="/invites/"
        icon={<PeopleIcon width={26} height={26} aria-hidden />}
      />
    </>
  );
}
