#!/usr/bin/env node
/**
 * The published Storybook never names Pam's live project (D-579; the Storybook twin of the e2e guard in `e2e/liveGuard.ts`, D-576).
 * Run after `storybook build`: fails when any bundle in the output names the live project, or when none names the stub.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIVE_REF = 'shobqzuhicoiymtumiaz';
export const STUB_URL = 'stub.supabase.co';

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(js|html|json|map)$/.test(name) ? [path] : [];
  });
}

/** Why the Storybook in `dir` may not be published, or null when it is for the stub project. */
export function whyNotPublishable(dir) {
  if (!existsSync(dir)) return `there is no build at ${dir}`;
  let sawStub = false;
  for (const path of files(dir)) {
    const text = readFileSync(path, 'utf8');
    if (text.includes(LIVE_REF)) return `${path.slice(dir.length + 1)} names the live project (${LIVE_REF})`;
    if (text.includes(STUB_URL)) sawStub = true;
  }
  return sawStub ? null : `it does not name the stub project (${STUB_URL}) anywhere`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ?? 'storybook-static';
  const reason = whyNotPublishable(dir);
  if (reason) {
    console.error(`Storybook must not be published: ${reason}.\nIt is built for the stub project in .storybook/main.ts (env).`);
    process.exit(1);
  }
  console.log(`Storybook names only the stub project (${STUB_URL}); no bundle names the live one.`);
}
