'use client';

import { useEffect, useState } from 'react';
import { DUMMY_CONNECTIONS } from '@pam/config/dummy-connections';
import { DUMMY_SELF } from '@pam/config/dummy-people';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useExamplesOn } from '@/lib/useExamplesOn';
import { usePointsState } from '@/lib/usePoints';
import { getReminderConsent } from '@/lib/useReminderConsent';
import { useSavedPlaces } from '@/lib/useSavedPlaces';
import { HeaderActions } from './HeaderActions';
import { ProfileView } from './ProfileView';
import { Page } from '@pam/ui';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { ProfileSummary } from '@pam/ui/ProfileCards';
import { previewOf, uploadStaffPhoto } from '@/lib/staffPhoto';
import { markSetupDone } from '@/lib/programSetup';
import { useI18n } from '@/lib/i18n';

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
  const examplesOn = useExamplesOn();
  const { points, loading: pointsLoading } = usePointsState(signedIn ? session.session.userId : null);
  const { state: saved } = useSavedPlaces(signedIn, demoRole);
  const [remindersOn, setRemindersOn] = useState(false);
  const { t } = useI18n();
  // A staff photo (D-345): shown at once from the phone, kept if the upload
  // lands, put back if it does not.
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const shownPhoto = photo ?? (signedIn && !demoRole ? session.session.photoUrl : null);
  const pickPhoto = (file: File) => {
    if (!signedIn) return;
    const before = shownPhoto;
    setPhoto(previewOf(file));
    setPhotoBusy(true);
    setPhotoFailed(false);
    void uploadStaffPhoto(session.session.userId, file).then((url) => {
      setPhotoBusy(false);
      // Saved: keep showing the picture already on screen, which is the
      // same photo; the stored copy is what everyone else sees.
      if (!url) {
        setPhoto(before);
        setPhotoFailed(true);
      } else markSetupDone('photo');
    });
  };

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
      // Not 0 until they are known: a pulse in the number's place, so a real 0 never flashes first (D-520).
      points={pointsLoading ? null : (points ?? 0)}
      savedCount={saved.status === 'ready' ? saved.places.length : saved.status === 'loading' ? null : 0}
      // There is no real list of people who offered help yet: a real account has none to count.
      connectionsCount={role === 'member' && examplesOn ? DUMMY_CONNECTIONS.length : 0}
      remindersOn={remindersOn}
      canViewAs={trueRole === 'super_admin'}
      canUseAs={signedIn && session.session.roles.includes('member') && session.session.roles.includes('provider')}
      headerActions={<HeaderActions role={viewedRole} enabled={signedIn} />}
      onSignOut={() => {
        void signOut().finally(() => router.replace('/signin/?out=1'));
      }}
      photoUrl={shownPhoto}
      onPhotoPick={pickPhoto}
      isPhotoBusy={photoBusy}
      photoNotice={photoFailed ? t('profile.photo.failed') : null}
    />
  );
}

/**
 * Profile while the account is still being found out (Will, 11 October: "skeleton loaders for the image, stats
 * and labels in profile hero card"; D-520): the title, then the hero card as pulses the size of the real one, and
 * nothing under it yet, because what goes there depends on who this is. A member's card (three stats) is drawn; a
 * staff account's has none, which makes it a little shorter, and that is the one thing that can still move.
 */
export function ProfileLoading() {
  const { t } = useI18n();
  return (
    <Page gap={4}>
      <LargeTitleHeader title={t('profile.title')} />
      <ProfileSummary name="" roleLabel="" stats={[]} isLoading loadingStatCount={3} loadingLabel={t('common.loading')} />
    </Page>
  );
}
