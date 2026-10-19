import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { APP_ERROR_ACTIONS, APP_ERROR_ACTION_SHAPE, APP_ERROR_ROUTES, appErrorCode, appErrorRoute, isAppErrorAction } from '../src/appErrors.js';

describe('the app error log takes only what is on its closed lists (D-616)', () => {
  it('every action key has the shape the database holds app_errors.action to, and is under 60 characters', () => {
    for (const key of APP_ERROR_ACTIONS) {
      expect(key, key).toMatch(APP_ERROR_ACTION_SHAPE);
      expect(key.length, key).toBeLessThanOrEqual(60);
    }
  });
  it('there are no repeats', () => {
    expect(new Set(APP_ERROR_ACTIONS).size).toBe(APP_ERROR_ACTIONS.length);
  });
  it('a key that is not on the list is not an action', () => {
    expect(isAppErrorAction('messages.send')).toBe(true);
    expect(isAppErrorAction('Will Smith at 3rd Street')).toBe(false);
    expect(isAppErrorAction('messages.send ')).toBe(false);
    expect(isAppErrorAction(undefined)).toBe(false);
  });
  it('a code is a status, a SQLSTATE, or offline, timeout or unknown; an error\'s own words are "unknown"', () => {
    expect(appErrorCode(500)).toBe('500');
    expect(appErrorCode('23505')).toBe('23505');
    expect(appErrorCode('P0001')).toBe('P0001');
    expect(appErrorCode('offline')).toBe('offline');
    expect(appErrorCode('timeout')).toBe('timeout');
    expect(appErrorCode('Key (phone)=(2155550100) already exists')).toBe('unknown');
    expect(appErrorCode('will@example.com')).toBe('unknown');
    expect(appErrorCode(undefined)).toBe('unknown');
    expect(appErrorCode('PAM_RATE_LIMITED')).toBe('unknown');
  });
});

/** Iris D1: the database holds the same closed lists as the app, and the app's routes are the app's folders. */
describe('the closed lists the database holds', () => {
  const migration = readFileSync(
    new URL('../../db/migrations/20261018211942_app_errors_a_log_of_what_broke_without_who.sql', import.meta.url),
    'utf8',
  );
  const listed = (name: string): string[] => {
    const block = migration.split(`-- ${name}: begin`)[1]?.split(`-- ${name}: end`)[0] ?? '';
    return Array.from(block.matchAll(/^\s+\('([^']+)'\),?$/gm), (m) => m[1]!);
  };

  it('the actions in the migration are APP_ERROR_ACTIONS, no more and no fewer', () => {
    expect(listed('app_error_actions').sort()).toEqual([...APP_ERROR_ACTIONS].sort());
  });

  it('the routes in the migration are APP_ERROR_ROUTES, no more and no fewer', () => {
    expect(listed('app_error_routes').sort()).toEqual([...APP_ERROR_ROUTES].sort());
  });

  it('APP_ERROR_ROUTES is every screen in the app: a folder with a page', () => {
    const root = fileURLToPath(new URL('../../../apps/web/src/app', import.meta.url));
    const found: string[] = [];
    const walk = (dir: string, at: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(join(dir, entry.name), `${at}${entry.name}/`);
        else if (entry.name === 'page.tsx') found.push(at);
      }
    };
    walk(root, '/');
    expect(found.sort()).toEqual([...APP_ERROR_ROUTES].sort());
  });

  it('appErrorRoute files an address under the app\'s screen, else /unknown, as the database does', () => {
    expect(appErrorRoute('/alerts/')).toBe('/alerts/');
    expect(appErrorRoute('/alerts?who=aaliyah')).toBe('/alerts/');
    expect(appErrorRoute('/messages/thread/#top')).toBe('/messages/thread/');
    expect(appErrorRoute('/')).toBe('/');
    expect(appErrorRoute('/aaliyah-smith/')).toBe('/unknown');
    expect(appErrorRoute(undefined)).toBe('/unknown');
  });

  it('no action or route is a key a person could be: all are the app\'s own words', () => {
    for (const action of APP_ERROR_ACTIONS) expect(action).toMatch(APP_ERROR_ACTION_SHAPE);
  });
});
