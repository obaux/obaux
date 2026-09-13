import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './project';

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
  // No configuration step, and nothing to forget: the project this app talks to
  // is checked in (see ./project), and an environment variable only overrides
  // it. A build that cannot reach the database because a dashboard field was
  // left blank is a failure mode PAM does not have.
  return createSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Phone + Twilio Verify is the only sign-in path (§9). There is no
      // email/password flow and no OAuth to detect in the URL.
      detectSessionInUrl: false,
    },
  });
}
