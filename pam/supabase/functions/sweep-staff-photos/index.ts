// sweep-staff-photos — see handler.ts for what it does and the rules it keeps.
//
// Deploy with JWT verification OFF, like the other clocks: the scheduler calls it with the shared secret.
// Secrets it reads (names only; values are never in this repository):
//   DISPATCH_SECRET    the shared secret the scheduler sends (x-dispatch-secret)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (provided)

import { handle, reply, type Deps } from './handler.ts';

Deno.serve((request) => {
  const deps: Deps = {
    get: (name) => Deno.env.get(name),
    fetch: (input, init) => fetch(input, init),
    now: () => Date.now(),
  };
  return handle(request, deps).catch((error) => {
    console.error('sweep-staff-photos failed', error instanceof Error ? error.message : 'unknown');
    return reply(500, { error: 'something went wrong' });
  });
});
