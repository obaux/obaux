// sms-inbound — see handler.ts for what it does and the rules it keeps.
//
// This file only wires the handler to the platform. Secrets it reads:
//   SMS_INBOUND        'on' to switch the function on (anything else: off)
//   TWILIO_AUTH_TOKEN  the same token the dispatcher uses; signs every request
//   SMS_INBOUND_URL    the exact address Twilio is told to call (the signature covers it)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (provided)
//
// Deploy with JWT verification off (`supabase functions deploy sms-inbound
// --no-verify-jwt`): Twilio sends no Supabase login, and the signature is the
// check instead.

import { empty, handle, type Deps } from './handler.ts';

Deno.serve((request) => {
  const deps: Deps = {
    get: (name) => Deno.env.get(name),
    fetch: (input, init) => fetch(input, init),
  };
  return handle(request, deps).catch((error) => {
    console.error('sms-inbound failed', error instanceof Error ? error.message : 'unknown');
    // Not a 2xx: Twilio should see that it was not recorded.
    return empty(500);
  });
});
