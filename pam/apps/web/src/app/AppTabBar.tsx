'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { Role } from '@pam/config';
import type { TabKey } from '@pam/ui/TabBar';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { tabFor } from '@/lib/tabs';
import { useProgramSetup } from '@/lib/programSetup';
import { RoleTabBar } from './RoleTabBar';
import { UnreadMessagesLazy } from './UnreadMessagesLazy';

/**
 * The bottom bar, in the app (D-210, D-212, D-218).
 *
 * Drawn under the five tab screens of whoever is signed in, with that role's
 * own tabs (`tabsFor`); a super admin previewing a role (D-108) gets that
 * role's bar from the next screen on. Nothing under a screen you tapped into
 * (`tabFor` is `null`), and nothing for somebody who is not signed in.
 *
 * Messages carries a dot when something is unread, from the account's own
 * conversations only — never from a preview, whose account has none to count
 * (D-171, D-172).
 */
export function AppTabBar() {
  const pathname = usePathname();
  const { state: session } = useSession();
  const [unread, setUnread] = useState(0);
  const onCount = useCallback((count: number) => setUnread(count), []);

  const tab = tabFor(pathname ?? '');
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  if (!tab || session.status !== 'signed-in' || trueRole === null) return null;

  const role: Role = viewedRole ?? trueRole;
  const canCount = trueRole === 'member' || trueRole === 'admin' || trueRole === 'provider';
  const bar = (
    <RoleTabBar
      current={tab}
      role={role}
      name={session.session.firstName ?? ''}
      photoUrl={session.session.photoUrl}
      unread={unread > 0}
    />
  );

  return (
    <>
      <UnreadMessagesLazy enabled={canCount} onCount={onCount} />
      {role === 'provider' && tab === 'program' ? <ProgramBarWhenLive tab={tab}>{bar}</ProgramBarWhenLive> : bar}
    </>
  );
}

/**
 * A lead's Program tab before the program is live is its own page — Add a
 * program, then Sent to Pam — and covers the bar (Will, D-383). Only a lead
 * asks for their program, so only here.
 */
function ProgramBarWhenLive({ tab, children }: { readonly tab: TabKey; readonly children: ReactNode }) {
  const { state: session } = useSession();
  const setup = useProgramSetup(session);
  if (tab === 'program' && !setup.isLive) return null;
  return <>{children}</>;
}
