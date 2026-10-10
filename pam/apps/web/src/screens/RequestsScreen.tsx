'use client';

import { Loading, Notice, Page, PeopleIcon, PlacesIcon, ShieldIcon } from '@pam/ui';
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
import { useStaffRequests } from '@/lib/useStaffRequests';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../app/RoleSwitchControl';

/**
 * Deciding who becomes a case manager or a program lead, for real (0054).
 *
 * `staff_requests` has recorded these claims since 0046 and nothing had ever
 * reviewed one — a super admin who wanted to bring somebody in had to make
 * them an invite by hand, asking them to sign up a second time. This is the
 * list; a row opens the request on a page of its own (`RequestReviewScreen`,
 * D-442) where the person is read, the program they described is looked at,
 * the city is picked and the decision is made.
 *
 * Reached from Profile, or from Home for a super admin, rather than from the
 * notification itself (Will, 17 September) — a notification here stays what
 * it already is everywhere else in Pam, a line in a log rather than a button
 * (D-080). The notification says something is waiting; this is where it is
 * found.
 */

const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

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

  const { state: requests } = useStaffRequests(isSuperAdmin);

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

      {requests.status === 'ready' && requests.requests.length > 0 ? (
        <MenuList
          label={t('requests.title')}
          hasDividers
          items={requests.requests.map((row) => ({
            id: row.userId,
            label: [row.firstName, row.lastName].filter(Boolean).join(' ') || t('invite.expired.someone'),
            description: [
              t('requests.wants', { role: t(`role.${row.wantsRole}`) }),
              ...(row.city ? [t('requests.city', { city: row.city })] : []),
              t('requests.requestedOn', { when: requestedWhen(row.createdAt, locale) }),
            ].join(' · '),
            href: `/requests/review/?id=${encodeURIComponent(row.userId)}`,
            icon: row.wantsRole === 'provider' ? <PlacesIcon {...ICON} /> : <ShieldIcon {...ICON} />,
          }))}
        />
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
