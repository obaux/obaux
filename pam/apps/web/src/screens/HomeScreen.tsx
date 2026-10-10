'use client';

import dynamic from 'next/dynamic';
import { Loading, Page } from '@pam/ui';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { ExploreScreen } from './ExploreScreen';

/*
 * Only a member's Explore is in this file's own bytes. A case manager's
 * caseload, a program's schedule and a super admin's requests are loaded when
 * that person is the one looking (`StaffHomes`, `RequestsScreen`): this is the
 * app's front door, which §12's first-load budget is measured on, and most
 * people through it are members who would otherwise download three screens
 * that are not theirs.
 */
const staffFallback = () => (
  <Page gap={3}>
    <Loading label="" variant="screen" />
  </Page>
);
const LegacyHome = dynamic(() => import('../app/LegacyHome').then((mod) => mod.LegacyHome), { loading: staffFallback });
const RequestsHome = dynamic(() => import('./RequestsScreen').then((mod) => mod.RequestsScreen), {
  loading: staffFallback,
});

/**
 * The first tab, for whoever is signed in (D-212): a member explores places;
 * a case manager sees their caseload; a program sees who wants in. A super
 * admin previewing a role sees that role's home (D-108); on their own
 * account, the staff requests waiting for a yes or no (D-257) — Explore is
 * a member's, and the catalogue is a row away on Profile (All programs).
 */
export function HomeScreen() {
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <Loading label="" variant="screen" />
      </Page>
    );
  }
  // Case managers and program leads keep the old Home, with its people strip, until the
  // strip's rings (D-198) are on the redesigned staff Homes and Will has said they stay
  // (Mira, 10 October; D-198 rings, Will asked 10 October, card a22). `StaffHomes` is built and waiting.
  if (viewedRole === 'admin' || viewedRole === 'provider') return <LegacyHome />;
  if (viewedRole === 'super_admin') return <RequestsHome isHome />;
  return <ExploreScreen />;
}
