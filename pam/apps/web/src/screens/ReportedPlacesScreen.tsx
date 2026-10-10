'use client';

import { useSearchParams } from 'next/navigation';
import { Loading, Notice } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { NOTICES } from '@pam/config';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { useI18n } from '@/lib/i18n';
import { useFlaggedPlaces } from '@/lib/useFlaggedPlaces';
import { useNow } from '@/lib/usePlaceStatus';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useRoleView } from '@/lib/useViewedRole';
import { NotIn } from '../app/NotIn';
import { ReportedPlacesLazy } from '../app/places/ReportedPlacesLazy';
import { RoleSwitchControl } from '../app/RoleSwitchControl';
import { HelpButton } from './HelpButton';

/**
 * Reported places, as a screen of its own (D-213, Dot's finding on the new app
 * shell): the review of places somebody said are closed, moved, full or wrong
 * used to live only behind a filter chip on the old Places page. It is reached
 * from the bell's "a place was reported" row and, for staff, from Profile — both
 * nested screens, so Back is a round button to where they came from.
 *
 * The list is the one the Reported filter draws (`ReportedPlaces`, D-189): the
 * same cards, the reason and the count, and — for a super admin — Keep it or
 * Take it off the list (which tells whoever saved it). A case manager sees the
 * list and cannot decide; the database would refuse them, so the buttons are not
 * drawn. A program lead or a member is told the screen is not theirs; the
 * database answers them nothing either (`flagged_services()`, 0066).
 */
export function ReportedPlacesScreen() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const params = useSearchParams();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { demoRole, setViewAs } = useRoleView(trueRole);
  const viewedRole = demoRole ?? trueRole;
  const canReview = viewedRole === 'admin' || viewedRole === 'super_admin';
  const realCanReview = trueRole === 'admin' || trueRole === 'super_admin';
  const { state: flagged, refresh } = useFlaggedPlaces(canReview && realCanReview);
  const now = useNow();

  // Where they came from: the bell, or Profile (the default for staff).
  const fromBell = params.get('from') === 'notifications';
  const back = fromBell
    ? { backHref: '/notifications/', backLabel: t('nav.back.notifications') }
    : { backHref: '/profile/', backLabel: t('nav.back.profile') };

  const actions = (
    <>
      {trueRole === 'super_admin' ? <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} /> : null}
      <HelpButton />
    </>
  );

  if (session.status === 'loading') {
    return (
      <SubPage title={t('places.reported.title')} {...back} actions={actions}>
        <Loading label={t('common.loading')} variant="screen" />
      </SubPage>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <SubPage title={t('places.reported.title')} {...back} actions={actions}>
        <NotIn status={session.status} title={t('places.reported.signedOut.title')} body={t('places.reported.signedOut.body')} />
      </SubPage>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <SubPage title={t('places.reported.title')} {...back} actions={actions}>
        <Notice
          notice={key}
          title={t(NOTICES[key].titleKey)}
          body={t(NOTICES[key].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      </SubPage>
    );
  }

  if (!canReview) {
    return (
      <SubPage title={t('places.reported.title')} {...back} actions={actions}>
        <Notice notice="something_went_wrong" title={t('admin.notAdmin.title')} body={t('admin.notAdmin.body')} supportPhone={supportPhone} callLabel={t('help.callSupport')} />
      </SubPage>
    );
  }

  return (
    <SubPage title={t('places.reported.title')} {...back} actions={actions}>
      <ReportedPlacesLazy
        state={realCanReview ? flagged : { status: 'empty' }}
        previewing={demoRole !== null || !realCanReview}
        canResolve={trueRole === 'super_admin' && demoRole === null}
        useDummy={USE_DUMMY_PEOPLE}
        onResolved={refresh}
        now={now}
        supportPhone={supportPhone}
      />
    </SubPage>
  );
}
