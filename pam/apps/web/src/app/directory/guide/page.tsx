'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loading, Notice, Page } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { DUMMY_EVERYONE } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { ChooseGuideView } from '../../../screens/ChooseGuideView';

/**
 * A member's guide, for the super admin (D-446), from a member's row on
 * Everyone. The row hands over the name and the current guide (both from
 * `directory_people` / `directory_guides`, which answer only a super admin);
 * `assign_guide` refuses anyone else.
 */
function Guide() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const params = useSearchParams();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const id = params.get('id') ?? '';
  const name = params.get('name') ?? t('messages.thread.someone');
  const current = params.get('guide');
  const isExample = DUMMY_EVERYONE.some((p) => p.id === id);
  const back = '/directory/';

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <SubPageHeader title={t('assignGuide.title', { name })} backHref={back} backLabel={t('assignGuide.back')} />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (viewedRole !== 'super_admin') {
    return (
      <Page gap={4}>
        <SubPageHeader title={t('directory.notSuper.title')} backHref="/" backLabel={t('nav.back.home')} />
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

  return (
    <ChooseGuideView
      mode="assign"
      personId={id}
      name={name}
      isExample={isExample}
      currentGuideId={current && current.length > 0 ? current : null}
      backHref={back}
      backLabel={t('assignGuide.back')}
    />
  );
}

export default function GuidePage() {
  return (
    <Suspense fallback={null}>
      <Guide />
    </Suspense>
  );
}
