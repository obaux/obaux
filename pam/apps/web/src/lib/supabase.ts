import { createBrowserClient } from '@supabase/ssr';

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

  return createBrowserClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Phone + Twilio Verify is the only sign-in path (§9). There is no
      // email/password flow and no OAuth to detect in the URL.
      detectSessionInUrl: false,
    },
  });
}
