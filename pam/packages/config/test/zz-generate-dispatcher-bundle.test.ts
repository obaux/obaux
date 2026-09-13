import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { SMS_TEMPLATES, SERVICE_FLAG_REASONS } from '../src/sms-templates.js';

/**
 * Not a test — a generator that runs in the one place that can already resolve
 * the workspace's TypeScript. The deployed dispatcher must carry the exact
 * template set the tests check, so it is produced from the source of truth
 * rather than retyped.
 */
it('writes the dispatcher template bundle', () => {
  const dir = '../../supabase/functions/dispatch-sms';
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    `${dir}/templates.json`,
    `${JSON.stringify({ templates: SMS_TEMPLATES, reasons: SERVICE_FLAG_REASONS }, null, 2)}\n`,
  );
});
