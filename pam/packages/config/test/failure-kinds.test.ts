import { describe, expect, it } from 'vitest';
import { FAILURE_CODES, FAILURE_KINDS, classifyFailure, type FailureKind } from '../src/failureKinds.js';
import { appErrorCode } from '../src/appErrors.js';

/** D-618: a failure is one of a closed set of kinds, from the codes the error log already holds. */
describe('classifyFailure', () => {
  const table: [string | number, FailureKind][] = [
    ['offline', 'offline'], ['000', 'offline'],
    ['timeout', 'timeout'],
    [401, 'signed-out'], ['PGRST301', 'signed-out'], ['JWT expired', 'signed-out'],
    [403, 'not-allowed'], ['42501', 'not-allowed'],
    [429, 'too-many'], ['PAM_RATE_LIMITED', 'too-many'],
    [409, 'changed'], ['23505', 'changed'], ['40001', 'changed'],
    [404, 'gone'], [406, 'gone'], ['PGRST116', 'gone'], ['23503', 'gone'],
    [500, 'server'], [502, 'server'], [503, 'server'], [504, 'server'],
  ];
  it.each(table)('%s is %s', (code, kind) => {
    expect(classifyFailure(code)).toBe(kind);
  });

  it('unknown, empty, unlisted and odd values are server', () => {
    for (const code of ['unknown', '', '   ', 'P0001', '400', '22P02', 'something else', undefined, null, {}, [], 0]) {
      expect(classifyFailure(code), String(code)).toBe('server');
    }
  });

  it('no network is offline whatever the code says', () => {
    for (const code of ['403', '500', 'unknown', 'timeout', '42501', undefined]) expect(classifyFailure(code, false), String(code)).toBe('offline');
  });

  it('the set is closed: every code maps into FAILURE_KINDS, every kind is reached, and there are eight', () => {
    expect(FAILURE_KINDS).toHaveLength(8);
    for (const kind of Object.values(FAILURE_CODES)) expect(FAILURE_KINDS).toContain(kind);
    for (const kind of FAILURE_KINDS) {
      if (kind === 'server') continue; // the fallback has no code of its own
      expect(Object.values(FAILURE_CODES), kind).toContain(kind);
    }
    expect(new Set(FAILURE_KINDS).size).toBe(FAILURE_KINDS.length);
  });

  it('a code that has been through appErrorCode still classifies: a status and a SQLSTATE survive, other words become server', () => {
    expect(classifyFailure(appErrorCode(403))).toBe('not-allowed');
    expect(classifyFailure(appErrorCode('23505'))).toBe('changed');
    expect(classifyFailure(appErrorCode('PGRST301'))).toBe('server'); // appErrorCode drops it; codeFromAnswer gives 401 instead
    expect(classifyFailure(appErrorCode('duplicate key (phone)=(+12155550100)'))).toBe('server');
  });

  it('does not read the prototype chain', () => {
    for (const code of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) expect(classifyFailure(code), code).toBe('server');
  });
});
