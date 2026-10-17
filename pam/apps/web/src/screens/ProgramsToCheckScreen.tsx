'use client';

import { useSearchParams } from 'next/navigation';
import { Page, Loading, Notice, PlacesIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPageHeader } from '@pam/ui/SubPage';
import { NOTICES, intlLocale } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { isLate, useProgramsToCheck, type ProgramToCheck, toLookAt } from '@/lib/programsToCheck';
import { NotIn } from '../app/NotIn';
import { HelpButton } from './HelpButton';

/**
 * Programs to check (D-386, part 6): what program leaders have sent for Pam to
 * look at, for a super admin — a first program, or a change to a live one — and
 * those a leader deleted to start over, which stay until they are discarded.
 * Rows, newest first; a row opens the review page where the decision is made.
 *
 * Nothing here says more than the lead's first name; the list is read through a
 * function that refuses anyone who is not a super admin.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

export function ProgramsToCheckScreen() {
  const { t, locale } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin' && trueRole === 'super_admin';
  const { state } = useProgramsToCheck(isSuperAdmin);

  // Back the way they came: Home's row says so (Iris, super admin P2); Profile's list is the default.
  const fromHome = useSearchParams().get('from') === 'home';
  const back = fromHome
    ? { backHref: '/', backLabel: t('nav.back.home') }
    : { backHref: '/profile/', backLabel: t('nav.back.profile') };
  const header = (subtitle?: string) => (
    <SubPageHeader title={t('review.title')} {...(subtitle ? { subtitle } : {})} {...back} actions={<HelpButton />} />
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
          contactLabel={t('help.contact.action')}
        />
      </Page>
    );
  }

  const when = (iso: string) => new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', day: 'numeric' }).format(new Date(iso));
  const line = (program: ProgramToCheck): string => {
    const status =
      program.status === 'withdrawn'
        ? t('review.status.withdrawn')
        : program.status === 'changes_asked'
          ? t('review.status.changes')
          : t('review.status.review');
    return [
      t(program.kind === 'change' ? 'review.kind.change' : 'review.kind.new'),
      program.leadName ? t('review.by', { name: program.leadName }) : null,
      t('review.sent', { when: when(program.sentAt) }),
      status,
      isLate(program) ? t('review.days', { days: program.daysWaiting }) : null,
    ]
      .filter(Boolean)
      .join(' · ');
  };

  return (
    <Page gap={4}>
      {header(state.status === 'ready' ? t('review.total', { total: toLookAt(state.programs) }) : undefined)}

      {state.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

      {state.status === 'error' ? (
        <Notice
          notice={state.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          contactLabel={t('help.contact.action')}
        />
      ) : null}

      {state.status === 'ready' && state.programs.length === 0 ? (
        <Notice
          notice="no_caseload_members"
          title={t('review.empty.title')}
          body={t('review.empty.body')}
          contactLabel={t('help.contact.action')}
        />
      ) : null}

      {state.status === 'ready' && state.programs.length > 0 ? (
        <MenuList
          label={t('review.title')}
          hasDividers
          items={state.programs.map((program) => ({
            id: program.id,
            label: program.programName,
            description: line(program),
            href: `/programs/review/item/?id=${encodeURIComponent(program.id)}`,
            icon: <PlacesIcon {...ICON} />,
          }))}
        />
      ) : null}
    </Page>
  );
}
