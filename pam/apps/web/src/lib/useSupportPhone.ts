'use client';

import { useEffect, useState } from 'react';
import { createClient } from './supabase';

/**
 * PAM's support line.
 *
 * Will has said this number will change over time, and it appears in the
 * HelpBar on every screen (§2.4), so it cannot be a build-time constant — a
 * redeploy to change a phone number is how the wrong number stays live for a
 * week. It lives in `app_settings`, which an admin can edit, and is readable by
 * signed-out visitors so someone who cannot get into the app can still call.
 *
 * The env value is the immediate fallback: the bar renders a working number on
 * first paint and swaps if the database has a newer one. If the fetch fails —
 * offline, which is the normal case for this audience (§12) — the fallback
 * stands. There is no state in which the HelpBar has no number.
 */
export function useSupportPhone(): string {
  const fallback = process.env['NEXT_PUBLIC_SUPPORT_PHONE'] ?? '+12673095265';
  const [phone, setPhone] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'support_phone')
          .maybeSingle();

        if (!cancelled && data?.value) setPhone(data.value);
      } catch {
        // Keep the fallback. Never surface this — a member looking for the help
        // button does not need to hear about a failed settings fetch.
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return phone;
}
