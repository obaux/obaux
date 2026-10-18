import { describe, expect, it } from 'vitest';
import { APP_ERROR_ACTIONS, APP_ERROR_ACTION_SHAPE, appErrorCode, isAppErrorAction } from '../src/appErrors.js';

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
