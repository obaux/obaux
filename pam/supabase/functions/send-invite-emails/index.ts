// send-invite-emails — see handler.ts for what it does and the rules it keeps.
//
// This file only wires the handler to the platform: the function's secrets,
// `fetch`, and the one email service. Secrets it reads:
//   INVITE_EMAILS      'on' to switch the function on (anything else: off)
//   DISPATCH_SECRET    the shared secret the scheduler sends (x-dispatch-secret)
//   RESEND_API_KEY     the email service's key — never in this repository
//   EMAIL_FROM         the sender, e.g. 'Pam <hello@mail.example>' (a verified domain)
//   EMAIL_REPLY_TO     optional: where a reply goes
//   APP_URL            where Pam lives, https, for the link and the logo
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (provided)

import { BUNDLE, handle, reply, type Deps } from './handler.ts';
import { resendEmailer } from './provider.ts';

Deno.serve((request) => {
  const key = Deno.env.get('RESEND_API_KEY');
  const deps: Deps = {
    get: (name) => Deno.env.get(name),
    fetch: (input, init) => fetch(input, init),
    emailer: key ? resendEmailer(key) : null,
    bundle: BUNDLE,
    sleep: (ms) => new Promise((done) => setTimeout(done, ms)),
  };
  return handle(request, deps).catch((error) => {
    console.error('send-invite-emails failed', error instanceof Error ? error.message : 'unknown');
    return reply(500, { error: 'something went wrong' });
  });
});
