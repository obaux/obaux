// help-request — see handler.ts for what it does and the rules it keeps.
//
// Deploy with JWT verification OFF: a visitor to joinpam.org has no Pam login, and the function guards
// itself (origin, honeypot, caps, rate limit). Secrets it reads (names only; values are never in this repository):
//   HELP_REQUESTS_LIVE   'on' to switch the function on (anything else: off, and the form shows the address)
//   RESEND_API_KEY       the email service's key
//   EMAIL_FROM           the sender, e.g. 'Pam <hello@mail.example>' (a verified domain)
//   HELP_REQUEST_SALT    any long random string: salts the hash of the caller's address for the rate limit
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (provided)

import { handle, type Deps } from './handler.ts';
import { resendEmailer } from './provider.ts';

Deno.serve((request) => {
  const key = Deno.env.get('RESEND_API_KEY');
  const deps: Deps = {
    get: (name) => Deno.env.get(name),
    fetch: (input, init) => fetch(input, init),
    emailer: key ? resendEmailer(key) : null,
  };
  return handle(request, deps).catch((error) => {
    console.error('help-request failed', error instanceof Error ? error.message : 'unknown');
    return new Response(JSON.stringify({ error: 'something went wrong' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
