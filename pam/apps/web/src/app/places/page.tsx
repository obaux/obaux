'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loading, Page } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';

/**
 * The old Places list, retired (Will, 13 October 2026: "no longer an active page that we support").
 *
 * Its two jobs live elsewhere now: a member's Explore (`/`) and, for a case manager or a program, All programs (`/programs/`, the same
 * screen in its programs mode). Reported places is its own screen (`/places/reported/`). So this address only forwards, with `replace` so
 * Back does not bounce, to the screen the person is really after: a member to `/`, a case manager or a program to `/programs/`, and
 * `?filter=reported` (the bell's old target) to Reported places for the people who review them. A super admin otherwise goes to Explore.
 */
function Forward() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);

  useEffect(() => {
    if (session.status === 'loading') return;
    if (params.get('filter') === 'reported' && (viewedRole === 'admin' || viewedRole === 'super_admin')) {
      router.replace('/places/reported/');
      return;
    }
    router.replace(viewedRole === 'admin' || viewedRole === 'provider' ? '/programs/' : '/');
  }, [session.status, viewedRole, params, router]);

  return (
    <Page gap={4}>
      <Loading label={t('common.loading')} variant="screen" />
    </Page>
  );
}

export default function PlacesPage() {
  return (
    <Suspense fallback={null}>
      <Forward />
    </Suspense>
  );
}
