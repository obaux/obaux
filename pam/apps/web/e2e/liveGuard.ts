import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The web e2e suite never reaches Pam's live project (D-576).
 *
 * `src/lib/project.ts` falls back to the live URL and publishable key when no `NEXT_PUBLIC_SUPABASE_*` is set at build time. CI sets a stub
 * (`https://stub.supabase.co`); a person's or a session's own container often does not, and a build made that way sends every call a spec does
 * not mock to the real project (on 14 October, about 3,500 refused requests in an hour; all were refused, but only because the stub sign-in
 * token is not a valid JWT, which is luck, not a rule). Two layers, so neither has to be remembered:
 *
 *   1. This check, run before any test: the build in `out/` must be for the stub project, or the run stops and says how to build it.
 *   2. The browser itself cannot reach anything outside this machine (`playwright.config.ts`: a dead proxy for every host but loopback), so
 *      even a wrong build, or a request nobody mocked, fails inside the browser instead of leaving it.
 */
export const LIVE_REF = 'shobqzuhicoiymtumiaz';
export const STUB_URL = 'stub.supabase.co';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(js|html)$/.test(name) ? [path] : [];
  });
}

/** Why the build in `dir` may not be tested, or null when it is for the stub project. */
export function whyNotTestable(dir: string): string | null {
  if (!existsSync(dir)) return `there is no build at ${dir}`;
  let sawStub = false;
  for (const path of files(dir)) {
    const text = readFileSync(path, 'utf8');
    if (text.includes(LIVE_REF)) return `${path.slice(dir.length + 1)} names the live project (${LIVE_REF})`;
    if (text.includes(STUB_URL)) sawStub = true;
  }
  return sawStub ? null : `it does not name the stub project (${STUB_URL}) anywhere`;
}

export const HOW_TO_BUILD = 'Build it for the tests with the stub project: `pnpm --filter @pam/web build:e2e` (it sets NEXT_PUBLIC_SUPABASE_URL=https://stub.supabase.co).';
