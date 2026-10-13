'use client';

import { useEffect, useState } from 'react';

/**
 * Whether a switch in `app_settings` is 'on' (D-481's pattern, `useTextsLive`). The table is readable by
 * everyone, signed out included (0009).
 *
 * Unknown counts as off: still loading, offline, or a failed read, so a screen never offers what the
 * server would not do. It reads the setting when the screen opens, so it comes on without a deploy.
 */
export function useSettingOn(key: string): boolean {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data } = await createClient().from('app_settings').select('value').eq('key', key).maybeSingle();
        if (!cancelled) setOn(data?.value === 'on');
      } catch {
        // Stay off.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return on;
}
