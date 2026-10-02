'use client';

import { useEffect, useState } from 'react';
import { DUMMY_CONNECTIONS } from '@pam/config/dummy-connections';
import { DUMMY_SELF } from '@pam/config/dummy-people';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { usePoints } from '@/lib/usePoints';
import { getReminderConsent } from '@/lib/useReminderConsent';
import { useSavedPlaces } from '@/lib/useSavedPlaces';
import { HeaderActions } from './HeaderActions';
import { ProfileView } from './ProfileView';

/**
 * Profile, wired (D-217): whoever is signed in, as the role they are looking
 * at. A super admin previewing a role sees that role's example name, as the
 * old home did (D-173), and keeps "See the app as" so the preview can be
 * undone from where it was set.
 */
export function ProfileScreen() {
  const router = useRouter();
  const { state: session } = useSession();
  const signedIn = session.status === 'signed-in';
  const trueRole = signedIn ? session.session.role : null;
  const { viewedRole, demoRole } = useRoleView(trueRole);
  const points = usePoints(signedIn ? session.session.userId : null);
  const { state: saved } = useSavedPlaces(signedIn, demoRole);
  const [remindersOn, setRemindersOn] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    void getReminderConsent(session.session.userId).then((on) => live && setRemindersOn(on === true));
    return () => {
      live = false;
    };
  }, [signedIn, session]);

  const role = viewedRole ?? 'member';
  const name =
    (demoRole ? DUMMY_SELF[demoRole]?.firstName : null) ?? (signedIn ? session.session.firstName : null) ?? '';

  return (
    <ProfileView
      name={name}
      role={role}
      points={points ?? 0}
      savedCount={saved.status === 'ready' ? saved.places.length : 0}
      connectionsCount={role === 'member' ? DUMMY_CONNECTIONS.length : 0}
      remindersOn={remindersOn}
      canViewAs={trueRole === 'super_admin'}
      headerActions={<HeaderActions role={viewedRole} enabled={signedIn} />}
      onSignOut={() => {
        void signOut().finally(() => router.replace('/signin/?out=1'));
      }}
    />
  );
}
