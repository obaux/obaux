import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

// The Storybook build refuses to publish a bundle that names Pam's live project (D-579).
type Guard = { whyNotPublishable: (dir: string) => string | null; LIVE_REF: string; STUB_URL: string };
const load = async (): Promise<Guard> =>
  (await import(pathToFileURL(join(process.cwd(), 'scripts/check-storybook-stub.mjs')).href)) as Guard;

const dirs: string[] = [];
function build(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'sb-guard-'));
  dirs.push(dir);
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), text);
  }
  return dir;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('check-storybook-stub', () => {
  it('passes a build that names only the stub', async () => {
    const { whyNotPublishable } = await load();
    expect(whyNotPublishable(build({ 'a.iframe.bundle.js': 'url="https://stub.supabase.co"' }))).toBeNull();
  });
  it('fails a bundle that names the live project, and says which', async () => {
    const { whyNotPublishable, LIVE_REF } = await load();
    const reason = whyNotPublishable(
      build({ 'a.js': 'https://stub.supabase.co', 'sub/b.js': `x="https://${LIVE_REF}.supabase.co"` }),
    );
    expect(reason).toContain('b.js');
    expect(reason).toContain(LIVE_REF);
  });
  it('fails a build that names no project at all, and a missing build', async () => {
    const { whyNotPublishable } = await load();
    expect(whyNotPublishable(build({ 'a.js': 'nothing here' }))).toContain('stub');
    expect(whyNotPublishable(join(tmpdir(), 'no-such-storybook'))).toContain('no build');
  });
});
