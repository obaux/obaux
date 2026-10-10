'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BigButton, Notice, Page } from '@pam/ui';
import { PersonDetailSkeleton } from '@pam/ui/Skeletons';
import { SubPageHeader } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useCaseloadPerson } from '@/lib/useGuides';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { ChooseGuideView } from '../../../screens/ChooseGuideView';

/**
 * Hand a member over to another case manager in your city (D-446), from the
 * member's page. Only someone on your own caseload (or the example cast).
 */
function HandOver() {
  const { t, tPlain } = useI18n();
  const supportPhone = useSupportPhone();
  const id = useSearchParams().get('id') ?? '';
  const { loading, person } = useCaseloadPerson(id);
  const back = `/person/?id=${encodeURIComponent(id)}`;

  if (loading || !person) {
    return (
      <Page gap={4}>
        <SubPageHeader title={t('person.title')} backHref="/" backLabel={t('nav.back.home')} />
        {loading ? (
          <PersonDetailSkeleton label={t('common.loading')} />
        ) : (
          <>
            <Notice
              notice="service_not_available"
              title={t('person.notFound.title')}
              body={t('person.notFound.body')}
              supportPhone={supportPhone}
              callLabel={t('help.callSupport')}
            />
            <BigButton label={t('nav.back.home')} href="/" />
          </>
        )}
      </Page>
    );
  }

  return (
    <ChooseGuideView
      mode="handover"
      personId={id}
      name={person.firstName}
      isExample={person.isExample}
      backHref={back}
      backLabel={tPlain('access.back', { name: person.firstName })}
    />
  );
}

export default function HandOverPage() {
  return (
    <Suspense fallback={null}>
      <HandOver />
    </Suspense>
  );
}
