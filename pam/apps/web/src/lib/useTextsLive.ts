'use client';

import { useEffect, useState } from 'react';

/**
 * Whether Pam may text anything but an account text right now: `app_settings.texts_live` is 'on'
 * (D-481, set by the merge desk on the day Will says go). The setting is readable by everyone.
 *
 * Unknown counts as off — still loading, offline, or a failed read — so a screen never promises a
 * text the server would hold. It reads the setting when the screen opens, so it comes on without a
 * deploy when the switch is flipped.
 */
export function useTextsLive(): boolean {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data } = await createClient()
          .from('app_settings')
          .select('value')
          .eq('key', 'texts_live')
          .maybeSingle();
        if (!cancelled) setOn(data?.value === 'on');
      } catch {
        // Stay off.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return on;
}
