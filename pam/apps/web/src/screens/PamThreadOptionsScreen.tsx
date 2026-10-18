'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loading, Notice, PhotoIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { usePamStatus } from '@/lib/pam';
import { PamTeamOptions } from './PamTeamTools';

/**
 * The Pam team's ⋯ for a Pam conversation (card a100, D-605; Dot's x6): Close or Reopen, and what was shared. No Report and
 * no Block: the team does not report or block the person writing to Pam. The person's own ⋯ stays the usual one.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

function PamThreadOptions() {
  const { t } = useI18n();
  const id = useSearchParams().get('id') ?? '';
  const threadHref = `/messages/thread/?id=${encodeURIComponent(id)}&from=pam`;
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isTeam = viewedRole === 'super_admin' && trueRole === 'super_admin';
  const pam = usePamStatus(isTeam);

  return (
    <SubPage title={t('messages.options.title')} backHref={threadHref} backLabel={t('messages.options.back')}>
      {session.status === 'loading' || (isTeam && pam.status === 'loading') ? (
        <Loading label={t('common.loading')} variant="inline" />
      ) : !isTeam || pam.status !== 'ready' || !id ? (
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          contactLabel={t('help.contact.action')}
        />
      ) : (
        <PamTeamOptions
          conversationId={id}
          more={[
            {
              id: 'files',
              label: t('messages.options.files'),
              href: `/messages/thread/files/?id=${encodeURIComponent(id)}`,
              icon: <PhotoIcon {...ICON} />,
            },
          ]}
        />
      )}
    </SubPage>
  );
}

export function PamThreadOptionsView() {
  return (
    <Suspense fallback={null}>
      <PamThreadOptions />
    </Suspense>
  );
}
