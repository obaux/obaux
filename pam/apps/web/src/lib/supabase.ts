import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * The browser Supabase client.
 *
 * Only the anon key ever reaches here. RLS is what protects the data (§4), and
 * the service role key exists solely inside Edge Functions for cron and imports
 * — if it ever appears in this file, every privacy promise in §4.1 is void.
 *
 * §12 requires sessions that persist for 90 days with no input timeouts, so
 * the session is stored and auto-refreshed rather than expiring a member out of
 * a half-finished enrolment.
 *
 * Plain `supabase-js`, not `@supabase/ssr`. The SSR client keeps the session in
 * a cookie so a server can read it — and PAM has no server: it is a static
 * export, wrapped by Capacitor into an app served from a local file scheme
 * where cookie behaviour is a coin toss. A session that quietly fails to
 * persist would sign a member out mid-enrolment, which is the exact failure
 * §12's 90-day rule exists to prevent. localStorage is the store that works in
 * a browser and in the shell.
 */
export function createClient() {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. ' +
        'Copy .env.example to .env.local and fill them in.',
    );
  }

  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Phone + Twilio Verify is the only sign-in path (§9). There is no
      // email/password flow and no OAuth to detect in the URL.
      detectSessionInUrl: false,
    },
  });
}
