// docusign-spike — THROWAWAY. See handler.ts. Deploy with JWT verification ON.
// Secrets it reads (names only): DOCUSIGN_PRIVATE_KEY, DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID (Will, in the Supabase
// secrets); DOCUSIGN_SPIKE_KEY_SHA256 and DOCUSIGN_SPIKE_UNTIL (the merge desk); SUPABASE_URL (provided).

import { handle, reply, type Deps } from './handler.ts';

Deno.serve((request) => {
  const deps: Deps = { get: (name) => Deno.env.get(name), fetch: (input, init) => fetch(input, init) };
  return handle(request, deps).catch(() => reply(500, { error: 'something went wrong' }));
});
