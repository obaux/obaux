// docusign-spike-hook — THROWAWAY. See handler.ts. Deploy with JWT verification OFF (DocuSign and a browser have no Pam sign-in).
// Secrets it reads (names only): DOCUSIGN_SPIKE_UNTIL (the merge desk); DOCUSIGN_CONNECT_KEY (Will, from DocuSign's Connect keys);
// DOCUSIGN_SPIKE_LOG_PAYLOAD (set to "1" for the one E1 check, then removed).

import { handle, type Deps } from './handler.ts';

Deno.serve((request) => {
  const deps: Deps = { get: (name) => Deno.env.get(name), log: (line) => console.log(line) };
  return handle(request, deps).catch(() => new Response('something went wrong', { status: 500 }));
});
