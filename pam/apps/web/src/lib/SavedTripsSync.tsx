'use client';

import { useEffect } from 'react';
import { setSavedTrips } from './addedTrips';
import { asksForSavedTrips, loadSavedTrips } from './savedTrips';
import { useSession } from './useSession';

/**
 * Reads a signed-in member's saved trips once per sign-in (D-454), so the map,
 * Trips, a place's page, Saved's visit tags and a conversation's visit card all
 * see them through `readAddedTrips`, with nothing to do on each screen. Mounted
 * once in `Providers`, like `LocaleSync`; anybody who is not a member asks for
 * nothing and any saved trips of the last person to sign in are cleared.
 */
export function SavedTripsSync() {
  const { state: session } = useSession();
  const userId = asksForSavedTrips(session);

  useEffect(() => {
    if (userId === null) {
      // Signed out, or not a member: no saved trips of anybody else's linger.
      if (session.status !== 'loading') setSavedTrips([], 'idle');
      return;
    }
    setSavedTrips([], 'loading');
    void loadSavedTrips();
  }, [userId, session.status]);

  return null;
}
