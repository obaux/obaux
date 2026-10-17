// pnpm --filter @pam/site posts:date <slug>=<YYYY-MM-DD> [<slug>=<YYYY-MM-DD> ...]
//
// Records the fingerprint of a post's words and the day they went live (src/content/post-updated.json) and writes that day as
// `updated` in src/content/posts.ts. Run it when a post's words change (test/post-dates.test.tsx says so when they do).
// `*=keep` records every post that has no record yet at the date it already shows (used once, to start the record).
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (!args.length || args.some((a) => !/^[\w*-]+=(keep|\d{4}-\d\d-\d\d)$/.test(a))) {
  console.error('usage: pnpm --filter @pam/site posts:date <slug>=<YYYY-MM-DD> [<slug>=<YYYY-MM-DD> ...]');
  process.exit(2);
}
const site = join(dirname(fileURLToPath(import.meta.url)), '..');
const r = spawnSync('npx', ['vitest', 'run', 'test/post-dates.test.tsx'], { cwd: site, stdio: 'inherit', env: { ...process.env, POST_DATES_WRITE: args.join(',') } });
process.exit(r.status ?? 1);
