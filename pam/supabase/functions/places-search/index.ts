// places-search — see handler.ts for what it does and the rules it keeps.
//
// Deploy with JWT verification ON: only a signed-in member asks. Secrets it reads (names only; values are never in this repository):
//   GOOGLE_MAPS_SERVER_KEY   a Google Maps Platform key for THIS function alone: restricted to the Places API (New), with a daily quota
//                            cap. Unset: the function answers { enabled: false } and the app keeps its own ZIP and neighborhood search.
//   SUPABASE_URL, SUPABASE_ANON_KEY   (provided)

import { handle, reply, type Deps } from './handler.ts';

Deno.serve((request) => {
  const deps: Deps = {
    get: (name) => Deno.env.get(name),
    fetch: (input, init) => fetch(input, init),
  };
  return handle(request, deps).catch(() => {
    console.error('places-search failed');
    return reply(500, { error: 'something went wrong' });
  });
});
