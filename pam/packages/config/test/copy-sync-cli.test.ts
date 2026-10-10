import { describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The draft script, run for real against a stand-in for the Messages API.
 *
 * The one thing that could not be tested without a key is the network call. This
 * runs the actual script on a copy of the language files, with the API pointed at a
 * local server that answers the way the real one does, so the request it builds
 * (path, headers, model, prompt), the way it reads the answer, what it writes, and
 * what the ledger says afterwards are all checked. The real service's acceptance of
 * the request is the one thing left untried.
 */
const run = promisify(execFile);
const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), 'copy-sync-'));
  mkdirSync(join(dir, 'scripts'));
  mkdirSync(join(dir, 'src'));
  cpSync(here('../scripts/copy-sync.mjs'), join(dir, 'scripts/copy-sync.mjs'));
  cpSync(here('../src/copy-sync.ts'), join(dir, 'src/copy-sync.ts'));
  cpSync(here('../src/locales'), join(dir, 'src/locales'), { recursive: true });
  return dir;
}

const node = (dir: string, args: string[], env: Record<string, string> = {}) =>
  run(process.execPath, ['--experimental-strip-types', '--no-warnings', join(dir, 'scripts/copy-sync.mjs'), ...args], {
    env: { ...process.env, ...env },
  }).then(
    (r) => ({ code: 0, out: r.stdout }),
    (e: { code?: number; stdout?: string }) => ({ code: e.code ?? 1, out: e.stdout ?? '' }),
  );

function standIn() {
  const seen: { path?: string; key?: string; version?: string; model?: string; users: string[] }[] = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const json = JSON.parse(body) as { model: string; messages: { content: string }[] };
      const user = json.messages[0]!.content;
      seen.push({
        path: req.url,
        key: String(req.headers['x-api-key']),
        version: String(req.headers['anthropic-version']),
        model: json.model,
        users: [user],
      });
      const out: Record<string, string> = {};
      for (const m of user.slice(user.indexOf('Translate these:')).matchAll(/^(\S+)\n {2}EN: (.*)$/gm)) {
        out[m[1]!] = `DRAFT ${m[2]}`;
      }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(out) }] }));
    });
  });
  return new Promise<{ url: string; seen: typeof seen; close: () => void }>((resolve) =>
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      resolve({ url: `http://127.0.0.1:${port}`, seen, close: () => server.close() });
    }),
  );
}

describe('copy:draft, run for real', () => {
  it('drafts what a reworded English string left stale — plural forms included — and the ledger accepts it', async () => {
    const dir = sandbox();
    const api = await standIn();
    try {
      // A repository, so the script can read what the English used to be.
      for (const args of [['init', '-q'], ['add', '-A'], ['-c', 'user.email=t@example.org', '-c', 'user.name=t', 'commit', '-qm', 'base']]) {
        await run('git', args, { cwd: dir });
      }
      const path = join(dir, 'src/locales/en.json');
      const en = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
      en['admin.points'] = '{count} members';
      writeFileSync(path, `${JSON.stringify(en, null, 2)}\n`);

      // Stale in every language, and in Russian and Arabic in each plural form.
      const before = await node(dir, ['status']);
      expect(before.code).toBe(1);
      expect(before.out).toMatch(/ru {2}\(4\)[\s\S]*stale {6}admin\.points\.few/);
      expect(before.out).toMatch(/ar {2}\(6\)[\s\S]*stale {6}admin\.points\.two/);

      // A dry run sends nothing.
      const dry = await node(dir, ['draft', '--dry-run'], { ANTHROPIC_BASE_URL: api.url });
      expect(dry.out).toContain('Dry run: nothing was sent');
      expect(api.seen).toHaveLength(0);

      const drafted = await node(dir, ['draft'], { ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_BASE_URL: api.url });
      expect(drafted.code).toBe(0);
      expect(drafted.out).toContain('rejected 0');

      // One request per language, built the way the service expects.
      expect(api.seen).toHaveLength(6);
      for (const request of api.seen) {
        expect(request.path).toBe('/v1/messages');
        expect(request.key).toBe('test-key');
        expect(request.version).toBe('2023-06-01');
        expect(request.model).toBe('claude-sonnet-5-5');
      }
      const russian = api.seen.find((r) => r.users[0]!.includes('admin.points.few'))!.users[0]!;
      expect(russian).toContain('the "few" plural form');
      expect(russian).toContain('(the English used to be: {count} points)');

      // Written into the files, every form.
      const ru = JSON.parse(readFileSync(join(dir, 'src/locales/ru.json'), 'utf8')) as Record<string, string>;
      expect(ru['admin.points']).toBe('DRAFT {count} members');
      for (const form of ['one', 'few', 'many']) expect(ru[`admin.points.${form}`], form).toBe('DRAFT {count} members');
      const ar = JSON.parse(readFileSync(join(dir, 'src/locales/ar.json'), 'utf8')) as Record<string, string>;
      for (const form of ['zero', 'one', 'two', 'few', 'many']) expect(ar[`admin.points.${form}`], form).toBe('DRAFT {count} members');

      // Answered, not yet recorded; then recorded.
      const after = await node(dir, ['status']);
      expect(after.out).not.toContain('stale');
      expect(after.out).toContain('changed');
      expect((await node(dir, ['ack'])).code).toBe(0);
      expect((await node(dir, ['status'])).code).toBe(0);
    } finally {
      api.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses to run without a key, and sends nothing', async () => {
    const dir = sandbox();
    const api = await standIn();
    try {
      const refused = await node(dir, ['draft'], { ANTHROPIC_API_KEY: '', ANTHROPIC_BASE_URL: api.url });
      expect(refused.code).toBe(2);
      expect(api.seen).toHaveLength(0);
    } finally {
      api.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
