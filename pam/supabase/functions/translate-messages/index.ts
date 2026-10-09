// translate-messages — see handler.ts for what it does and the rules it keeps.
//
// This file only wires the handler to the platform: the function's secrets,
// `fetch`, and the one translation service. Secrets it reads:
//   MESSAGE_TRANSLATION        'on' to switch the function on (anything else: off)
//   ANTHROPIC_API_KEY          the translation service's key
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY   (provided)

import { anthropicTranslator } from './anthropic.ts';
import { handle, reply, type Deps } from './handler.ts';

Deno.serve((request) => {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  const deps: Deps = {
    get: (name) => Deno.env.get(name),
    fetch: (input, init) => fetch(input, init),
    translator: key ? anthropicTranslator(key) : null,
  };
  return handle(request, deps).catch((error) => {
    console.error('translate-messages failed', error instanceof Error ? error.message : 'unknown');
    return reply(500, { error: 'something went wrong' });
  });
});
