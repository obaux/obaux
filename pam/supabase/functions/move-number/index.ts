// move-number — see handler.ts for what it does and the rules it keeps (D-567).
//
// This file only wires the handler to the platform. Secrets it reads (all provided by Supabase):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// Deploy with JWT verification on: only a signed-in person can call it, and the database decides
// whether they may move anything.

import { handle, reply, type Deps } from './handler.ts';

Deno.serve((request) => {
  const deps: Deps = {
    get: (name) => Deno.env.get(name),
    fetch: (input, init) => fetch(input, init),
  };
  return handle(request, deps).catch((error) => {
    console.error('move-number failed', error instanceof Error ? error.message : 'unknown');
    return reply(500, { error: 'something went wrong' });
  });
});
