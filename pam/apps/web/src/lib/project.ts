/**
 * Which PAM this build talks to.
 *
 * These are checked in on purpose, and that is the whole point: **PAM needs no
 * configuration to run.** Clone it and `pnpm dev` works. Push it and Vercel
 * builds something that works. Wrap it with Capacitor and the app works. Nobody
 * has to know that a dashboard somewhere holds four strings the build silently
 * depends on — which is exactly how a deploy ends up pointing at nothing and
 * failing at the one screen every person starts on.
 *
 * ## Why it is safe to commit these
 *
 * The publishable key is designed to ship inside client JavaScript. It is in
 * the bundle of every deployed copy of this app already; anybody can read it
 * with View Source, on any Supabase project in the world. It grants nothing on
 * its own: **the access rules in the database are the boundary**, they are
 * written in `packages/db`, and `pnpm --filter @pam/db test` attacks them with
 * one test user per role. If publishing this key mattered, that suite would be
 * the thing that was broken.
 *
 * ## What must never appear in this file
 *
 * The **service role key**, which bypasses every access rule, and any Twilio
 * credential. Those live in Supabase Edge Function secrets and nowhere else. A
 * test in this package fails the build if something shaped like one turns up
 * here.
 *
 * ## Changing project
 *
 * Every value can still be overridden with an environment variable, for a
 * staging project or a fork. Nothing needs to be set for the real one.
 */

/** The pilot project: `pam`, us-east-1, closest region to Philadelphia. */
export const SUPABASE_URL =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? 'https://shobqzuhicoiymtumiaz.supabase.co';

/** Publishable, not secret. See the note above before worrying about it. */
export const SUPABASE_PUBLISHABLE_KEY =
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? 'sb_publishable_-Wl4FRkeoRtyQ6OeKnT9Xw_V0vzicKJ';

/**
 * The address PAM answers on, for links that leave the app.
 *
 * Not the origin the page was served from: an invite link is built inside the
 * Capacitor shell as often as in a browser, and there the origin is a local
 * file server. A link to `capacitor://localhost` in a text message is a dead
 * end for the person who receives it.
 */
export const APP_URL = (
  process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://web-ten-umber-88.vercel.app'
).replace(/\/+$/, '');
