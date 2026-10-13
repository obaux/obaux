// calendar-feed — see handler.ts for what it does and the rules it keeps.
//
// Deploy with JWT verification OFF: a calendar app has no Pam login, and the address is the key.
// Secrets it reads (names only): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (both provided).

import { handle, NOT_FOUND, type Deps } from './handler.ts';

Deno.serve((request) => {
  const deps: Deps = { get: (name) => Deno.env.get(name), fetch: (input, init) => fetch(input, init) };
  return handle(request, deps).catch((error) => {
    // A status or a reason, never an address or a value.
    console.error('calendar-feed failed', error instanceof Error ? error.message : 'unknown');
    return request.method === 'GET' || request.method === 'HEAD' ? new Response('Something went wrong', { status: 500 }) : NOT_FOUND();
  });
});
