import { describe, expect, it } from 'vitest';
import { googleReturnOf, stateOf } from './useGoogleCalendar';

describe('stateOf', () => {
  it('shows nothing until Pam is switched on', () => {
    expect(stateOf(null)).toEqual({ status: 'hidden' });
    expect(stateOf({ live: false })).toEqual({ status: 'hidden' });
  });
  it('tells off, connected and broken apart', () => {
    expect(stateOf({ live: true, connected: false, state: null })).toEqual({ status: 'off' });
    expect(stateOf({ live: true, connected: true, state: 'connected' })).toEqual({ status: 'connected' });
    expect(stateOf({ live: true, connected: true, state: 'broken' })).toEqual({ status: 'broken' });
  });
});

describe('googleReturnOf', () => {
  it('reads what Google\'s sign-in left in the address, and nothing else', () => {
    expect(googleReturnOf('?google=connected')).toBe('connected');
    expect(googleReturnOf('?google=failed')).toBe('failed');
    expect(googleReturnOf('?google=off')).toBe('off');
    expect(googleReturnOf('?google=<script>')).toBeNull();
    expect(googleReturnOf('')).toBeNull();
  });
});
