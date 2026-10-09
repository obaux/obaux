// The one place a message leaves Pam to be translated: a call to Anthropic's
// Messages API, with the key in the function's own secrets (never in the app,
// never in this repository).
//
// It is a `Translator` like any other: swapping the service means writing
// another one of these, nothing else. What it sends is the words of the
// messages being read and the name of the language to put them into — no
// names, no phone numbers, no account ids, no conversation. Message ids go
// with them only so the answers can be matched up, and mean nothing outside
// Pam.

import { buildPrompt, parseReply, type Incoming, type Locale, type Translated, type Translator } from './core.ts';

export const MODEL = 'claude-haiku-5-5';

export function anthropicTranslator(apiKey: string, model = MODEL): Translator {
  return {
    name: `anthropic:${model}`,
    async translate(items: readonly Incoming[], target: Locale): Promise<readonly Translated[]> {
      const { system, user } = buildPrompt(items, target);
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          temperature: 0,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      });
      if (!response.ok) {
        // The status only: the body of an error can echo the request, and the
        // request is somebody's message.
        throw new Error(`translation service answered ${response.status}`);
      }
      const payload = (await response.json()) as { content?: { type: string; text?: string }[] };
      const text = payload.content?.find((c) => c.type === 'text')?.text ?? '';
      return parseReply(text, items, target);
    },
  };
}
