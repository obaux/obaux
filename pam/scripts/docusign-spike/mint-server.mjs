#!/usr/bin/env node
// THROWAWAY (card a88): a small local page for Iris's signing-page script. Opening http://127.0.0.1:PORT/mint/E1 makes a NEW made-up envelope,
// asks docusign-spike for a fresh one-time signing link, and redirects to it. The spike key stays in this container (a file); the DocuSign
// keys stay in Supabase. Nobody else sees more than the one-time link.
//
//   SUPABASE_URL=https://….supabase.co SUPABASE_ANON_KEY=… SPIKE_KEY_FILE=/path/to/key node mint-server.mjs [port]
//
//   /mint/E1   /mint/E100   /mint/Ear        add ?display=focused&origin=https://… for the focused view (record only)
//   /mint/E1?connect=1                       the envelope tells Connect (only once the hook has its key)
//   /whoami    /status/<envelopeId>          read-only checks
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const { SUPABASE_URL, SUPABASE_ANON_KEY, SPIKE_KEY_FILE } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SPIKE_KEY_FILE) throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY and SPIKE_KEY_FILE are needed');
const key = readFileSync(SPIKE_KEY_FILE, 'utf8').trim();
const port = Number(process.argv[2] ?? 8787);

async function spike(body) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/docusign-spike`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY, 'x-spike-key': key },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const send = (status, body) => (response.writeHead(status, { 'Content-Type': 'application/json' }), response.end(JSON.stringify(body)));
  try {
    const mint = /^\/mint\/(E1|E100|Ear)$/.exec(url.pathname);
    if (mint) {
      const made = await spike({ action: 'envelope', which: mint[1], connect: url.searchParams.get('connect') === '1' });
      if (!made.body.envelopeId) return send(502, made);
      const display = url.searchParams.get('display');
      const view = await spike({ action: 'mint', envelopeId: made.body.envelopeId, ...(display === 'focused' ? { display, origin: url.searchParams.get('origin') ?? '' } : {}) });
      if (!view.body.url) return send(502, view);
      console.log(`${mint[1]} envelope ${made.body.envelopeId}`);
      response.writeHead(302, { Location: view.body.url });
      return response.end();
    }
    if (url.pathname === '/whoami') return send(200, (await spike({ action: 'whoami' })).body);
    const status = /^\/status\/([0-9a-f-]{36})$/.exec(url.pathname);
    if (status) return send(200, (await spike({ action: 'status', envelopeId: status[1] })).body);
    return send(404, { error: 'not found' });
  } catch (error) {
    return send(500, { error: String(error?.message ?? error) });
  }
}).listen(port, '127.0.0.1', () => console.log(`mint server on http://127.0.0.1:${port}`));
