'use client';

import { useEffect, useState } from 'react';

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
 *
 * The Supabase client is imported dynamically, inside the effect. It is roughly
 * 60 kB gzipped and nothing on first paint depends on it: the number is already
 * on screen from the env value before this runs. Importing it statically put the
 * whole client library in the first load of every route for a lookup that is
 * pure enhancement — §12 budgets 500 kB for a 3G connection, and this was an
 * eighth of it.
 *
 * Deferring it is safe precisely because the fallback is not a degraded state.
 * Anything a member needs when the network has ALREADY failed — the error
 * notices, the help bar itself — must stay eagerly loaded, because a chunk that
 * cannot download is a blank screen at the exact moment someone needs help.
 */
export function useSupportPhone(): string {
  const fallback = process.env['NEXT_PUBLIC_SUPPORT_PHONE'] ?? '+12673095265';
  const [phone, setPhone] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { createClient } = await import('./supabase');
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
