import { describe, expect, it } from 'vitest';
import { failureKindOf } from './malfunctionKind';

describe('failureKindOf', () => {
  it('sorts a code into what to say', () => {
    expect(failureKindOf('offline')).toBe('offline');
    expect(failureKindOf('timeout')).toBe('offline');
    expect(failureKindOf('401')).toBe('signedOut');
    expect(failureKindOf('42501')).toBe('signedOut');
    expect(failureKindOf('500')).toBe('server');
    expect(failureKindOf(503)).toBe('server');
    expect(failureKindOf('23505')).toBe('other');
    expect(failureKindOf('unknown')).toBe('other');
  });
});
