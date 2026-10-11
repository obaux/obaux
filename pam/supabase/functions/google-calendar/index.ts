// google-calendar — see handler.ts for what it does and the rules it keeps.
//
// Deploy with JWT verification OFF (Google's redirect and the database clock have no member login; the member's own
// calls are checked inside against their login). It does nothing until GOOGLE_SYNC_LIVE is 'on'.

import { handle, type Deps } from './handler.ts';

Deno.serve((request) => {
  const deps: Deps = { get: (name) => Deno.env.get(name), fetch: (input, init) => fetch(input, init) };
  return handle(request, deps).catch((error) => {
    // A reason, never a token or a name.
    console.error('google-calendar failed', error instanceof Error ? error.message : 'unknown');
    return new Response(JSON.stringify({ error: 'something went wrong' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  });
});
